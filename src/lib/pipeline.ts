import { classifyAndMatch } from './ai';
import { getDashboardState, registerComplaint, NewComplaintResult } from './store';
import { Complaint } from './types';

/**
 * Full pipeline for a NEW incoming complaint:
 * LLM classify + cluster-match (with rule-based fallback) → register in store.
 */
export async function processIncomingComplaint(
  text: string,
  source: Complaint['source'],
  submittedBy: string,
): Promise<NewComplaintResult> {
  const state = getDashboardState();
  const issuesForMatch = state.issues.map((i) => ({
    id: i.id,
    title: i.title,
    category: i.category,
    ward: i.ward,
  }));

  const result = await classifyAndMatch(text, issuesForMatch);

  return registerComplaint({
    textOriginal: text,
    language: result.language,
    translationEn: result.translationEn,
    summaryEn: result.summaryEn,
    category: result.category,
    urgency: result.urgency,
    ward: result.ward,
    location: result.location,
    source,
    submittedBy,
    aiClassified: result.aiClassified,
    matchedIssueId: result.matchedIssueId,
  });
}
