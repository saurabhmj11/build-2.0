export type Category =
  | 'Roads'
  | 'Water'
  | 'Sanitation'
  | 'Electricity'
  | 'Health'
  | 'Education'
  | 'Parks'
  | 'Safety'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Roads',
  'Water',
  'Sanitation',
  'Electricity',
  'Health',
  'Education',
  'Parks',
  'Safety',
  'Other',
];

export type Urgency = 1 | 2 | 3 | 4 | 5;

export type Source = 'WhatsApp' | 'Phone' | 'Letter' | 'Walk-in' | 'App' | 'Voice note';

export type MpladsStatus = 'Completed' | 'Ongoing' | 'Delayed' | 'Sanctioned – not started';

export interface Complaint {
  id: string;
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

export interface IssueView extends Issue {
  count: number;
  priority: number;
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

export interface DashboardState {
  complaints: Complaint[];
  issues: IssueView[];
  fundSummary: FundSummary;
  livePoolRemaining: number;
  totalComplaints: number;
  aiClassifiedCount: number;
  clusterSavings: number; // complaints - issues ("noise removed")
}

export const DEPARTMENT_BY_CATEGORY: Record<Category, string> = {
  Roads: 'Public Works Department (PWD)',
  Water: 'Public Health Engineering Dept / Jal Board',
  Sanitation: 'Municipal Sanitation Department',
  Electricity: 'State Electricity Board',
  Health: 'District Health Department',
  Education: 'District Education Department',
  Parks: 'Horticulture & Parks Department',
  Safety: 'Municipal Safety & Traffic Cell',
  Other: 'District Administration',
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  1: 'Routine',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};
