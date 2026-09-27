import {
  Complaint,
  DashboardState,
  FundSummary,
  Issue,
  IssueView,
  MpladsRecord,
  Urgency,
  VerificationFlags,
  VerificationSummary,
} from './types';
import {
  LIVE_POOL,
  MPLADS_ENTITLEMENT_LAKH,
  MPLADS_RECORDS,
  SEED_COMPLAINTS,
  SEED_ISSUES,
} from './seed';

interface StoreState {
  complaints: Complaint[];
  issues: Issue[];
  livePoolIndex: number;
  reportCache: Map<string, { report: unknown; countAtGeneration: number }>;
  issueCounter: number;
  aiClassifiedCount: number;
}

const globalForStore = globalThis as unknown as {
  __citizenPulseStore?: StoreState;
};

function minutesAgoISO(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function seedStore(): StoreState {
  const complaints: Complaint[] = SEED_COMPLAINTS.map((c) => ({
    id: c.id,
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
  }));

  const issues: Issue[] = SEED_ISSUES.map((iss) => {
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

function getStore(): StoreState {
  if (!globalForStore.__citizenPulseStore) {
    globalForStore.__citizenPulseStore = seedStore();
  }
  return globalForStore.__citizenPulseStore;
}

export function resetStore(): void {
  globalForStore.__citizenPulseStore = seedStore();
}

/**
 * MPLADS match — deterministic & explainable: same ward + same category family.
 * Category families let e.g. 'Sanitation' complaints match 'Sanitation' works
 * while never cross-linking Water (pipeline) with Sanitation (drainage).
 */
const CATEGORY_FAMILY: Record<string, string[]> = {
  Roads: ['Roads'],
  Water: ['Water'],
  Sanitation: ['Sanitation'],
  Electricity: ['Electricity'],
  Health: ['Health'],
  Education: ['Education'],
  Parks: ['Parks'],
  Safety: ['Safety'],
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
  // Distinct submitters (normalized) + duplicate filers
  const byName = new Map<string, { display: string; times: number }>();
  for (const c of complaints) {
    const key = c.submittedBy.trim().toLowerCase();
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
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = complaints[i];
      const b = complaints[j];
      if (
        a.submittedBy.trim().toLowerCase() === b.submittedBy.trim().toLowerCase()
      ) {
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
    const submitters = new Set(
      g.map((i) => complaints[i].submittedBy.trim().toLowerCase()),
    );
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
): { disputed: boolean; disputeReason: string | null } {
  if (!mplads || mplads.status !== 'Completed' || !mplads.completionDate) {
    return { disputed: false, disputeReason: null };
  }
  const completedAt = new Date(mplads.completionDate);
  const after = complaints.filter((c) => new Date(c.createdAt) > completedAt);
  if (complaints.length >= 2 && after.length === complaints.length) {
    const dateStr = new Date(mplads.completionDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return {
      disputed: true,
      disputeReason: `Official record marks this work completed on ${dateStr} (₹${mplads.amountLakh}L sanctioned), but ${complaints.length} citizen complaints about the same problem post-date the recorded completion. Objective mismatch between two data sources: official record vs ground reports — physical verification recommended.`,
    };
  }
  return { disputed: false, disputeReason: null };
}

function computeFundSummary(issues: IssueView[], records: MpladsRecord[]): FundSummary {
  const sanctionedLakh = records.reduce((s, r) => s + r.amountLakh, 0);
  const matched = issues.filter((i) => i.mplads);
  const tiedLakh = matched.reduce((s, i) => s + (i.mplads?.amountLakh ?? 0), 0);
  return {
    entitlementLakh: MPLADS_ENTITLEMENT_LAKH,
    sanctionedLakh,
    tiedToOpenComplaintsLakh: tiedLakh,
    matchedWorksCount: matched.length,
    totalWorksCount: records.length,
    delayedWorksCount: records.filter((r) => r.status === 'Delayed').length,
  };
}

export function getDashboardState(): DashboardState {
  const store = getStore();
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
    const mplads = matchMplads(issue, MPLADS_RECORDS);
    const { disputed, disputeReason } = computeDispute(complaints, mplads);
    return {
      ...issue,
      urgency,
      count,
      distinctCount: verification.distinctSubmitters,
      priority: verification.distinctSubmitters * urgency, // verified ranking
      rawPriority: count * urgency, // what raw volume would have scored
      verification,
      disputed,
      disputeReason,
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
  };

  return {
    complaints: complaintsDesc,
    issues: issueViews,
    fundSummary: computeFundSummary(issueViews, MPLADS_RECORDS),
    verificationSummary,
    livePoolRemaining: LIVE_POOL.length - store.livePoolIndex,
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
}

export function registerComplaint(input: RegisterComplaintInput): NewComplaintResult {
  const store = getStore();
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
  };
  store.complaints.push(complaint);
  if (input.aiClassified) store.aiClassifiedCount += 1;

  return { complaint, issue, isNewIssue };
}

export function getIssueById(issueId: string): IssueView | null {
  const state = getDashboardState();
  return state.issues.find((i) => i.id === issueId) ?? null;
}

export function getComplaintsForIssue(issueId: string): Complaint[] {
  const store = getStore();
  return store.complaints
    .filter((c) => c.issueId === issueId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function nextPoolItem(): { text: string; source: Complaint['source']; submittedBy: string } | null {
  const store = getStore();
  if (store.livePoolIndex >= LIVE_POOL.length) return null;
  const item = LIVE_POOL[store.livePoolIndex];
  store.livePoolIndex += 1;
  return item;
}

export function getReportCache(key: string): { report: unknown; countAtGeneration: number } | undefined {
  return getStore().reportCache.get(key);
}

export function setReportCache(key: string, report: unknown, countAtGeneration: number): void {
  getStore().reportCache.set(key, { report, countAtGeneration });
}

export function getMpladsRecords(): MpladsRecord[] {
  return MPLADS_RECORDS;
}
