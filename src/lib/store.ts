import {
  Complaint,
  DashboardState,
  FundSummary,
  Issue,
  IssueView,
  MpladsRecord,
  ProfileSource,
  SubmitterProfile,
  Urgency,
  VerificationFlags,
  VerificationSummary,
} from './types';
import { categoryWeight } from './profile';
import { constituencyMeta } from './constituencies';
import {
  CONSTITUENCY_SEEDS,
  MPLADS_ENTITLEMENT_LAKH,
} from './seed';

interface StoreState {
  complaints: Complaint[];
  issues: Issue[];
  livePoolIndex: number;
  reportCache: Map<string, { report: unknown; countAtGeneration: number }>;
  issueCounter: number;
  aiClassifiedCount: number;
}

/** Constituency = first-class tenant key (ARCHITECTURE.md scaling path). */
const globalForStore = globalThis as unknown as {
  __citizenPulseStores?: Record<string, StoreState>;
};

function minutesAgoISO(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function seedStore(constituencyId: string): StoreState {
  const seed = CONSTITUENCY_SEEDS[constituencyId];
  if (!seed) throw new Error(`Unknown constituency: ${constituencyId}`);

  const complaints: Complaint[] = seed.complaints.map((c) => ({
    id: c.id,
    submitterId: seed.submitters[c.submittedBy] ?? `PH-00000-${c.id}`,
    textOriginal: c.textOriginal,
    language: c.language,
    translationEn: c.translationEn,
    summaryEn: c.summaryEn,
    category: c.category,
    urgency: c.urgency,
    ward: c.ward,
    location: c.location,
    source: c.source,
    submittedBy: c.submittedBy,
    createdAt: minutesAgoISO(c.minutesAgo),
    issueId: c.issueId,
    aiClassified: false, // historical archive: pre-classified ground truth
    photoAnalysis: c.photoAnalysis,
    submitterProfile: c.submitterProfile ?? 'general',
    profileSource: c.submitterProfile
      ? (c.profileSource ?? 'declared')
      : 'default',
  }));

  const issues: Issue[] = seed.issues.map((iss) => {
    const mine = complaints.filter((c) => c.issueId === iss.id);
    const sorted = [...mine].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    return {
      ...iss,
      complaintIds: mine.map((c) => c.id),
      createdAt: sorted[0]?.createdAt ?? minutesAgoISO(480),
      lastActivityAt: sorted[sorted.length - 1]?.createdAt ?? minutesAgoISO(60),
    };
  });

  return {
    complaints,
    issues,
    livePoolIndex: 0,
    reportCache: new Map(),
    issueCounter: 1,
    aiClassifiedCount: 0,
  };
}

function getStore(constituencyId: string): StoreState {
  if (!globalForStore.__citizenPulseStores) {
    globalForStore.__citizenPulseStores = {};
  }
  if (!globalForStore.__citizenPulseStores[constituencyId]) {
    globalForStore.__citizenPulseStores[constituencyId] = seedStore(constituencyId);
  }
  return globalForStore.__citizenPulseStores[constituencyId];
}

export function resetStore(constituencyId: string): void {
  if (globalForStore.__citizenPulseStores) {
    delete globalForStore.__citizenPulseStores[constituencyId];
  }
}

/**
 * MPLADS match — deterministic & explainable: same ward + same category family.
 * Category families keep Water (pipeline) separate from Drainage (storm water).
 */
const CATEGORY_FAMILY: Record<string, string[]> = {
  Roads: ['Roads'],
  Water: ['Water'],
  Drainage: ['Drainage'],
  Sanitation: ['Sanitation'],
  Electricity: ['Electricity'],
  Health: ['Health'],
  Education: ['Education'],
  Parks: ['Parks'],
  Safety: ['Safety'],
  Pollution: ['Pollution'],
  Other: ['Other'],
};

export function matchMplads(issue: Issue, records: MpladsRecord[]): MpladsRecord | null {
  const family = CATEGORY_FAMILY[issue.category] ?? [issue.category];
  return (
    records.find(
      (r) =>
        r.ward.toLowerCase() === issue.ward.toLowerCase() &&
        family.includes(r.category),
    ) ?? null
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 4a — anti-manipulation verification (deterministic, explainable)
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATED_SIMILARITY_THRESHOLD = 0.7;
const TEMPLATED_WINDOW_MS = 60 * 60_000; // "short time window" = 1 hour

function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jaccardSimilarity(a: string, b: string): number {
  const ta = new Set(normalizeForCompare(a).split(' ').filter(Boolean));
  const tb = new Set(normalizeForCompare(b).split(' ').filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

function computeVerification(complaints: Complaint[]): VerificationFlags {
  // Distinct submitters (mock phone-verified identity, ARCHITECTURE.md 4a)
  // + duplicate filers
  const byName = new Map<string, { display: string; times: number }>();
  for (const c of complaints) {
    const key = c.submitterId || c.submittedBy.trim().toLowerCase();
    const e = byName.get(key);
    if (e) e.times += 1;
    else byName.set(key, { display: c.submittedBy, times: 1 });
  }
  const distinctSubmitters = byName.size;
  const duplicateSubmitters = [...byName.values()]
    .filter((e) => e.times > 1)
    .map((e) => ({ name: e.display, times: e.times }))
    .sort((a, b) => b.times - a.times);

  // Templated-phrase groups: union-find over near-identical complaints from
  // DIFFERENT submitters inside a short window. (Same-person repeats are
  // handled by the distinct-submitter de-weight, not by this check.)
  const n = complaints.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]));
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  const submitterKey = (c: Complaint) => c.submitterId || c.submittedBy.trim().toLowerCase();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = complaints[i];
      const b = complaints[j];
      if (submitterKey(a) === submitterKey(b)) {
        continue; // same person — duplicate path, not coordination
      }
      const gap = Math.abs(+new Date(a.createdAt) - +new Date(b.createdAt));
      if (gap > TEMPLATED_WINDOW_MS) continue;
      if (
        jaccardSimilarity(a.textOriginal, b.textOriginal) >=
        TEMPLATED_SIMILARITY_THRESHOLD
      ) {
        union(i, j);
      }
    }
  }
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    const g = groups.get(r) ?? [];
    g.push(i);
    groups.set(r, g);
  }
  let templatedGroupIdx: number[] = [];
  for (const g of groups.values()) {
    const submitters = new Set(g.map((i) => submitterKey(complaints[i])));
    if (g.length >= 3 && submitters.size >= 2 && g.length > templatedGroupIdx.length) {
      templatedGroupIdx = g;
    }
  }
  const templatedGroupSubmitters = [...new Set(templatedGroupIdx.map((i) => complaints[i].submittedBy))];
  const templatedGroupSize = templatedGroupIdx.length;
  const coordinationSuspected = templatedGroupSize >= 3 && templatedGroupSubmitters.length >= 2;

  return {
    distinctSubmitters,
    duplicateSubmitters,
    templatedGroupSize,
    templatedGroupSubmitters,
    coordinationSuspected,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 4b — ground-truth dispute flag on official completion records
// ─────────────────────────────────────────────────────────────────────────────

function computeDispute(
  complaints: Complaint[],
  mplads: MpladsRecord | null,
): {
  disputed: boolean;
  disputeReason: string | null;
  reportsSinceCompletion: number;
} {
  if (!mplads || mplads.status !== 'Completed' || !mplads.completionDate) {
    return { disputed: false, disputeReason: null, reportsSinceCompletion: 0 };
  }
  const completedAt = new Date(mplads.completionDate);
  const after = complaints.filter((c) => new Date(c.createdAt) > completedAt);
  if (complaints.length >= 2 && after.length >= 2) {
    const dateStr = new Date(mplads.completionDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return {
      disputed: true,
      disputeReason: `Official record marks this work completed on ${dateStr} (₹${mplads.amountLakh}L sanctioned), but ${after.length} citizen complaints about the same problem post-date the recorded completion. Objective mismatch between two data sources: official record vs ground reports — physical verification recommended.`,
      reportsSinceCompletion: after.length,
    };
  }
  return { disputed: false, disputeReason: null, reportsSinceCompletion: after.length };
}

function computeFundSummary(
  issues: IssueView[],
  records: MpladsRecord[],
  constituencyId: string,
): FundSummary {
  const seed = CONSTITUENCY_SEEDS[constituencyId];
  const sanctionedLakh = records.reduce((s, r) => s + r.amountLakh, 0);
  // The accountability punchline: sanctioned money tied to issues that are
  // STILL open on the ground (disputed completions count as still-open).
  const tied = issues.filter(
    (i) => i.mplads && (i.mplads.status !== 'Completed' || i.disputed),
  );
  const tiedLakh = tied.reduce((s, i) => s + (i.mplads?.amountLakh ?? 0), 0);

  // ── Module 6 — fund utilisation & work-quality arithmetic ──
  const tranches = seed.fundTranches;
  const receivedLakh = tranches.reduce((s, t) => s + t.amountLakh, 0);
  const linkedSpentLakh = records.reduce((s, r) => s + (r.spentLakh ?? 0), 0);
  const other = seed.otherWorks;
  const spentLakh = Math.round((linkedSpentLakh + other.spentLakh) * 10) / 10;
  const totalSanctionedLakh = sanctionedLakh + other.sanctionedLakh;
  const rated = records.filter((r) => r.quality);
  const avgQuality = rated.length
    ? Math.round((rated.reduce((s, r) => s + (r.quality?.composite ?? 0), 0) / rated.length) * 10) / 10
    : null;

  return {
    entitlementLakh: MPLADS_ENTITLEMENT_LAKH,
    sanctionedLakh,
    tiedToOpenComplaintsLakh: tiedLakh,
    matchedWorksCount: issues.filter((i) => i.mplads).length,
    totalWorksCount: records.length,
    delayedWorksCount: records.filter((r) => r.status === 'Delayed').length,
    // Module 6
    tranches,
    receivedLakh,
    totalSanctionedLakh,
    spentLakh,
    linkedSpentLakh: Math.round(linkedSpentLakh * 10) / 10,
    balanceLakh: Math.round((receivedLakh - spentLakh) * 10) / 10,
    uncommittedLakh: Math.round((receivedLakh - totalSanctionedLakh) * 10) / 10,
    utilizationPct: receivedLakh > 0 ? Math.round((spentLakh / receivedLakh) * 1000) / 10 : 0,
    otherWorks: other,
    allWorksCount: records.length + other.worksCount,
    allCompletedCount:
      records.filter((r) => r.status === 'Completed').length + other.completedCount,
    avgQuality,
    qualityAlertsCount: rated.filter((r) => r.quality!.band === 'Poor').length,
  };
}

export function getDashboardState(constituencyId: string): DashboardState {
  const store = getStore(constituencyId);
  const records = CONSTITUENCY_SEEDS[constituencyId].mplads;
  const complaintById = new Map(store.complaints.map((c) => [c.id, c]));
  const oneHourAgo = Date.now() - 60 * 60_000;

  const issueViews: IssueView[] = store.issues.map((issue) => {
    const complaints = issue.complaintIds
      .map((id) => complaintById.get(id))
      .filter((c): c is Complaint => Boolean(c));
    const count = complaints.length;
    const urgency = complaints.reduce(
      (max, c) => (c.urgency > max ? c.urgency : max),
      1 as Urgency,
    );
    const recentCount = complaints.filter(
      (c) => +new Date(c.createdAt) >= oneHourAgo,
    ).length;
    const sorted = [...complaints].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
    const verification = computeVerification(complaints);
    const mplads = matchMplads(issue, records);
    const { disputed, disputeReason, reportsSinceCompletion } = computeDispute(complaints, mplads);
    // Coordinated campaigns are quarantined from the ranking (rank capped at
    // urgency, pending human review) — ARCHITECTURE.md Module 3.
    const quarantined = verification.coordinationSuspected;

    // Module 5 — occupation profile aggregation over DISTINCT citizens only.
    // A citizen who ever filed as a farmer is counted as a farmer (one
    // citizen, one vote — and one occupation signal).
    const profileById = new Map<string, SubmitterProfile>();
    for (const c of complaints) {
      const key = c.submitterId || c.submittedBy.trim().toLowerCase();
      const cur = profileById.get(key);
      const p: SubmitterProfile = c.submitterProfile ?? 'general';
      if (!cur || (cur === 'general' && p === 'farmer')) {
        profileById.set(key, p);
      }
    }
    const farmerCount = [...profileById.values()].filter((p) => p === 'farmer').length;
    const generalCount = profileById.size - farmerCount;
    // Strict majority of distinct reporters decides the weight table.
    const profile: SubmitterProfile = farmerCount > generalCount ? 'farmer' : 'general';
    const profileWeight = categoryWeight(profile, issue.category);

    const unweightedPriority =
      (quarantined ? 1 : verification.distinctSubmitters) * urgency;
    // The occupation weight is NOT volume-driven, so it applies even to
    // quarantined clusters (the cap neutralizes count, not the weighting).
    const priority = Math.round(unweightedPriority * profileWeight * 10) / 10;

    return {
      ...issue,
      urgency,
      count,
      distinctCount: verification.distinctSubmitters,
      priority,
      rawPriority: count * urgency, // what raw volume alone would have scored
      unweightedPriority,
      farmerCount,
      generalCount,
      profile,
      profileWeight,
      verification,
      disputed,
      disputeReason,
      reportsSinceCompletion,
      quarantined,
      mplads,
      recentCount,
      sampleComplaints: sorted.slice(0, 3),
    };
  });

  issueViews.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt);
  });

  const complaintsDesc = [...store.complaints].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  const verificationSummary: VerificationSummary = {
    issuesChecked: issueViews.length,
    verifiedGenuine: issueViews.filter(
      (i) =>
        !i.verification.coordinationSuspected &&
        i.verification.duplicateSubmitters.length === 0 &&
        !i.disputed,
    ).length,
    coordinationFlagged: issueViews.filter((i) => i.verification.coordinationSuspected)
      .length,
    duplicateDeWeighted: issueViews.filter(
      (i) => i.verification.duplicateSubmitters.length > 0,
    ).length,
    disputedCompletions: issueViews.filter((i) => i.disputed).length,
    farmerWeighted: issueViews.filter((i) => i.profile === 'farmer').length,
  };

  // Ward hotspot stats for the inline SVG map (wards with MPLADS works are
  // included even at zero complaints, so quiet-but-funded wards stay visible)
  const wardAgg = new Map<
    string,
    { complaintCount: number; issueCount: number; topIssue: string; topPriority: number }
  >();
  const ensureWard = (ward: string) => {
    let e = wardAgg.get(ward);
    if (!e) {
      e = { complaintCount: 0, issueCount: 0, topIssue: '', topPriority: -1 };
      wardAgg.set(ward, e);
    }
    return e;
  };
  for (const r of records) ensureWard(r.ward);
  for (const iv of issueViews) {
    if (!iv.ward || iv.ward === 'Unknown') continue;
    const e = ensureWard(iv.ward);
    e.issueCount += 1;
    e.complaintCount += iv.count;
    if (iv.priority > e.topPriority) {
      e.topPriority = iv.priority;
      e.topIssue = iv.title;
    }
  }
  const wardNumber = (w: string) => Number(w.replace(/[^0-9]/g, '')) || 99;
  const wardStats = [...wardAgg.entries()]
    .map(([ward, v]) => ({
      ward,
      complaintCount: v.complaintCount,
      issueCount: v.issueCount,
      topIssue: v.topIssue || null,
      hasMplads: records.some((r) => r.ward === ward),
    }))
    .sort((a, b) => wardNumber(a.ward) - wardNumber(b.ward));

  return {
    constituency: constituencyMeta(constituencyId),
    complaints: complaintsDesc,
    issues: issueViews,
    fundSummary: computeFundSummary(issueViews, records, constituencyId),
    mpladsWorks: records,
    verificationSummary,
    wardStats,
    livePoolRemaining: CONSTITUENCY_SEEDS[constituencyId].livePool.length - store.livePoolIndex,
    totalComplaints: store.complaints.length,
    aiClassifiedCount: store.aiClassifiedCount,
    clusterSavings: store.complaints.length - store.issues.length,
  };
}

export interface NewComplaintResult {
  complaint: Complaint;
  issue: Issue;
  isNewIssue: boolean;
}

export interface RegisterComplaintInput {
  textOriginal: string;
  language: string;
  translationEn: string;
  summaryEn: string;
  category: Complaint['category'];
  urgency: Urgency;
  ward: string;
  location: string;
  source: Complaint['source'];
  submittedBy: string;
  aiClassified: boolean;
  /** if the classifier matched an existing issue */
  matchedIssueId: string | null;
  /** Module 5 — occupation profile (declared or inferred at intake) */
  submitterProfile: SubmitterProfile;
  profileSource: ProfileSource;
  /** Module 7 — AI vision analysis of an attached photo (evidence text) */
  photoAnalysis?: string;
}

export function registerComplaint(
  constituencyId: string,
  input: RegisterComplaintInput,
): NewComplaintResult {
  const store = getStore(constituencyId);
  const id = `c-${String(store.complaints.length + 1).padStart(3, '0')}-${Date.now()
    .toString(36)
    .slice(-4)}`;
  const now = new Date().toISOString();

  let issue: Issue;
  let isNewIssue = false;

  const existing = input.matchedIssueId
    ? store.issues.find((i) => i.id === input.matchedIssueId)
    : undefined;

  if (existing) {
    existing.complaintIds.push(id);
    existing.lastActivityAt = now;
    if (input.urgency > existing.urgency) existing.urgency = input.urgency;
    issue = existing;
  } else {
    isNewIssue = true;
    issue = {
      id: `iss-auto-${store.issueCounter}-${Date.now().toString(36).slice(-4)}`,
      title: input.summaryEn,
      category: input.category,
      ward: input.ward,
      location: input.location,
      urgency: input.urgency,
      complaintIds: [id],
      createdAt: now,
      lastActivityAt: now,
    };
    store.issues.push(issue);
    store.issueCounter += 1;
  }

  const complaint: Complaint = {
    id,
    submitterId: `citizen:${(input.submittedBy || 'anonymous').trim().toLowerCase()}`,
    textOriginal: input.textOriginal,
    language: input.language,
    translationEn: input.translationEn,
    summaryEn: input.summaryEn,
    category: input.category,
    urgency: input.urgency,
    ward: input.ward,
    location: input.location,
    source: input.source,
    submittedBy: input.submittedBy,
    createdAt: now,
    issueId: issue.id,
    aiClassified: input.aiClassified,
    photoAnalysis: input.photoAnalysis,
    submitterProfile: input.submitterProfile,
    profileSource: input.profileSource,
  };
  store.complaints.push(complaint);
  if (input.aiClassified) store.aiClassifiedCount += 1;

  return { complaint, issue, isNewIssue };
}

export function getIssueById(constituencyId: string, issueId: string): IssueView | null {
  const state = getDashboardState(constituencyId);
  return state.issues.find((i) => i.id === issueId) ?? null;
}

export function getComplaintsForIssue(constituencyId: string, issueId: string): Complaint[] {
  const store = getStore(constituencyId);
  return store.complaints
    .filter((c) => c.issueId === issueId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function nextPoolItem(
  constituencyId: string,
): { text: string; source: Complaint['source']; submittedBy: string } | null {
  const store = getStore(constituencyId);
  const pool = CONSTITUENCY_SEEDS[constituencyId].livePool;
  if (store.livePoolIndex >= pool.length) return null;
  const item = pool[store.livePoolIndex];
  store.livePoolIndex += 1;
  return item;
}

export function getReportCache(
  constituencyId: string,
  key: string,
): { report: unknown; countAtGeneration: number } | undefined {
  return getStore(constituencyId).reportCache.get(key);
}

export function setReportCache(
  constituencyId: string,
  key: string,
  report: unknown,
  countAtGeneration: number,
): void {
  getStore(constituencyId).reportCache.set(key, { report, countAtGeneration });
}

export function getMpladsRecords(constituencyId: string): MpladsRecord[] {
  return CONSTITUENCY_SEEDS[constituencyId].mplads;
}
