export type Category =
  | 'Roads'
  | 'Water'
  | 'Drainage'
  | 'Sanitation'
  | 'Electricity'
  | 'Health'
  | 'Education'
  | 'Parks'
  | 'Safety'
  | 'Pollution'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Roads',
  'Water',
  'Drainage',
  'Sanitation',
  'Electricity',
  'Health',
  'Education',
  'Parks',
  'Safety',
  'Pollution',
  'Other',
];

export type Urgency = 1 | 2 | 3 | 4 | 5;

/** Module 5 — occupation profile for priority weighting. */
export type SubmitterProfile = 'general' | 'farmer';
/** How the profile was captured: intake self-declaration vs text inference. */
export type ProfileSource = 'declared' | 'inferred' | 'default';

export type Source = 'WhatsApp' | 'Phone' | 'Letter' | 'Walk-in' | 'App' | 'Voice note';

export type MpladsStatus = 'Completed' | 'Ongoing' | 'Delayed' | 'Sanctioned – not started';

// ─────────────────────────────────────────────────────────────────────────────
// Module 6 — Fund Utilisation & Work Quality ledger
// ─────────────────────────────────────────────────────────────────────────────

/** Quality band for a COMPLETED work: composite ≥4 Good · 3–3.9 Satisfactory · <3 Poor. */
export type QualityBand = 'Good' | 'Satisfactory' | 'Poor';

/** Composite quality = 60% citizen rating + 40% third-party inspection (1–5). */
export function compositeQuality(citizen: number, inspection: number): number {
  return Math.round((0.6 * citizen + 0.4 * inspection) * 10) / 10;
}

export function qualityBandOf(composite: number): QualityBand {
  if (composite >= 4) return 'Good';
  if (composite >= 3) return 'Satisfactory';
  return 'Poor';
}

/**
 * Module 6 — post-completion quality rating for a completed work.
 * Citizen side: one rating per phone-verified citizen (linked complainants +
 * nearby residents, SMS survey after recorded completion) — same one-citizen-
 * one-vote discipline as Module 4a, so brigading cannot inflate it.
 * Official side: mandatory third-party engineer inspection for works > ₹10L.
 */
export interface WorkQuality {
  /** mean of distinct-citizen ratings, 1–5 */
  citizenRating: number;
  /** how many distinct phone-verified citizens rated */
  citizenResponses: number;
  /** third-party engineer audit, 1–5 */
  inspectionScore: number;
  /** 0.6 × citizen + 0.4 × inspection */
  composite: number;
  band: QualityBand;
}

/** Module 6 — one GoI release into the constituency MPLADS account. */
export interface FundTranche {
  id: string;
  /** e.g. "MPLADS FY 2025-26 — Tranche 1" */
  label: string;
  /** release date */
  date: string;
  amountLakh: number;
}

/**
 * Module 6 — MPLADS works with NO open citizen complaint, shown in aggregate
 * only (the dashboard tracks the complaint-linked slice in detail). Keeps the
 * fund arithmetic honest without drowning the demo in unrelated works.
 */
export interface OtherWorksSummary {
  worksCount: number;
  completedCount: number;
  sanctionedLakh: number;
  spentLakh: number;
  /** mean composite of rated completions in this aggregate */
  avgQuality: number | null;
  /** a few example work names (tooltip flavour) */
  examples: string[];
}

export interface Complaint {
  id: string;
  /** mock phone-verified identity (per ARCHITECTURE.md 4a) — same id = same citizen */
  submitterId: string;
  textOriginal: string;
  language: string;
  translationEn: string;
  summaryEn: string;
  category: Category;
  urgency: Urgency;
  ward: string;
  location: string;
  source: Source;
  submittedBy: string;
  createdAt: string; // ISO
  issueId: string;
  aiClassified: boolean; // true = processed by live LLM pipeline
  /** Module 7 — AI vision analysis of an attached photo (evidence text) */
  photoAnalysis?: string;
  /** Module 5 — occupation profile ('general' by default) */
  submitterProfile: SubmitterProfile;
  /** declared at intake · inferred from complaint text · default (no signal) */
  profileSource: ProfileSource;
}

export interface MpladsRecord {
  id: string;
  workName: string;
  ward: string;
  category: Category;
  amountLakh: number;
  sanctionDate: string; // ISO date
  /** for works recorded as Completed — the official completion claim */
  completionDate?: string;
  status: MpladsStatus;
  implementingAgency: string;
  /** Module 6 — amount actually utilised/drawn so far (₹ lakh) */
  spentLakh?: number;
  /** Module 6 — physical progress on the ground, 0–100 */
  progressPct?: number;
  /** Module 6 — post-completion rating (completed works only) */
  quality?: WorkQuality;
}

export interface Issue {
  id: string;
  title: string;
  category: Category;
  ward: string;
  location: string;
  urgency: Urgency; // max urgency across cluster
  complaintIds: string[];
  createdAt: string;
  lastActivityAt: string;
}

export interface MpladsMatch {
  record: MpladsRecord;
  /** complaint count when the match was made */
  matchedAt: string;
}

/** Module 4a — anti-manipulation signals per issue. */
export interface VerificationFlags {
  distinctSubmitters: number;
  /** submitters who filed more than once inside this cluster (de-weighted) */
  duplicateSubmitters: { name: string; times: number }[];
  /** largest group of near-identical, templated complaints across DIFFERENT submitters */
  templatedGroupSize: number;
  templatedGroupSubmitters: string[];
  coordinationSuspected: boolean;
}

export interface VerificationSummary {
  issuesChecked: number;
  verifiedGenuine: number;
  coordinationFlagged: number;
  duplicateDeWeighted: number;
  disputedCompletions: number;
  /** Module 5 — issues whose priority is farmer-weighted */
  farmerWeighted: number;
}

export interface IssueView extends Issue {
  count: number;
  /** Module 4a: distinct citizens — the number the ranking actually uses */
  distinctCount: number;
  /** distinct citizens × urgency × occupation weight (verified, weighted) */
  priority: number;
  /** count × urgency (what volume alone would have scored) */
  rawPriority: number;
  /** distinct × urgency BEFORE the occupation weight — the counterfactual */
  unweightedPriority: number;
  /** Module 5 — distinct farmers among the verified reporters */
  farmerCount: number;
  /** Module 5 — distinct general citizens among the verified reporters */
  generalCount: number;
  /** Module 5 — dominant profile of distinct reporters (strict majority) */
  profile: SubmitterProfile;
  /** Module 5 — the multiplier actually applied (profile × category) */
  profileWeight: number;
  verification: VerificationFlags;
  /** Module 4b: official record says Completed, but ground reports continue */
  disputed: boolean;
  disputeReason: string | null;
  /** complaints filed AFTER the recorded completion date (Module 4b copy) */
  reportsSinceCompletion: number;
  /** Module 4a: suspected coordinated campaign → rank capped at urgency (human review) */
  quarantined: boolean;
  mplads: MpladsRecord | null;
  recentCount: number; // complaints in the "last hour" (demo window)
  sampleComplaints: Complaint[];
}

export interface Report {
  issueId: string;
  department: string;
  headline: string;
  executiveSummary: string;
  actionPlan: string[];
  budgetEstimateLakh: number | null;
  budgetReasoning: string;
  sanctionedLakh: number | null;
  shortfallLakh: number | null;
  rtiApplication: string;
  rtiApplicable: boolean;
  generatedAt: string;
  aiGenerated: boolean;
}

export interface FundSummary {
  entitlementLakh: number; // ₹5 crore/year
  sanctionedLakh: number;
  tiedToOpenComplaintsLakh: number;
  matchedWorksCount: number;
  totalWorksCount: number;
  delayedWorksCount: number;
  // ── Module 6 — the full fund utilisation & work-quality picture ──
  /** GoI releases into the MPLADS account, chronologically */
  tranches: FundTranche[];
  /** total received from the government across tranches */
  receivedLakh: number;
  /** sanctioned across ALL works (complaint-linked + other) */
  totalSanctionedLakh: number;
  /** utilised across ALL works (money actually drawn) */
  spentLakh: number;
  /** utilised on the complaint-linked works this dashboard tracks */
  linkedSpentLakh: number;
  /** received − spent (unspent cash in the account) */
  balanceLakh: number;
  /** received − total sanctioned (not yet committed to any work) */
  uncommittedLakh: number;
  /** spent ÷ received × 100 */
  utilizationPct: number;
  /** works with no open complaint — aggregate only */
  otherWorks: OtherWorksSummary;
  /** ALL works in the constituency (linked + other) */
  allWorksCount: number;
  allCompletedCount: number;
  /** mean composite over RATED linked works (null if none rated yet) */
  avgQuality: number | null;
  /** linked completions rated Poor → quality alerts */
  qualityAlertsCount: number;
}

export interface WardStat {
  ward: string;
  complaintCount: number;
  issueCount: number;
  topIssue: string | null;
  hasMplads: boolean;
}

export interface DashboardState {
  constituency: import('./constituencies').ConstituencyMeta;
  complaints: Complaint[];
  issues: IssueView[];
  fundSummary: FundSummary;
  /** Module 6 — the tracked (complaint-linked) works ledger, full detail */
  mpladsWorks: MpladsRecord[];
  verificationSummary: VerificationSummary;
  wardStats: WardStat[];
  livePoolRemaining: number;
  totalComplaints: number;
  aiClassifiedCount: number;
  clusterSavings: number; // complaints - issues ("noise removed")
}

export const DEPARTMENT_BY_CATEGORY: Record<Category, string> = {
  Roads: 'Public Works Department (PWD)',
  Water: 'Public Health Engineering Dept / Municipal Water Works',
  Drainage: 'Storm Water Drains Department (Municipal Corporation)',
  Sanitation: 'Municipal Solid Waste Management Department',
  Electricity: 'Municipal Street Lighting / State Electricity Board',
  Health: 'District Health Department',
  Education: 'District Education Department',
  Parks: 'Horticulture & Parks Department',
  Safety: 'Municipal Safety & Traffic Cell',
  Pollution: 'Maharashtra Pollution Control Board (MPCB)',
  Other: 'District Administration',
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  1: 'Routine',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};
