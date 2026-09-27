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

export type Source = 'WhatsApp' | 'Phone' | 'Letter' | 'Walk-in' | 'App' | 'Voice note';

export type MpladsStatus = 'Completed' | 'Ongoing' | 'Delayed' | 'Sanctioned – not started';

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
}

export interface IssueView extends Issue {
  count: number;
  /** Module 4a: distinct citizens — the number the ranking actually uses */
  distinctCount: number;
  priority: number; // distinctSubmitters × urgency (verified)
  rawPriority: number; // count × urgency (what volume alone would have scored)
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
