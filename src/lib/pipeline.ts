import { classifyAndMatch } from './ai';
import { getDashboardState, registerComplaint, NewComplaintResult } from './store';
import { Complaint, ProfileSource, SubmitterProfile } from './types';

/**
 * Full pipeline for a NEW incoming complaint (constituency-scoped):
 * LLM classify + cluster-match + occupation inference (with rule-based
 * fallback) → register in store.
 *
 * Module 5: a self-DECLARED occupation at intake overrides the text-inferred
 * profile — the citizen's own statement wins.
 *
 * Module 7: an attached photo's AI vision analysis rides along as evidence —
 * the classifier treats it as ground truth for category/severity, and it is
 * stored on the complaint so reports and dispute flags can cite it.
 */
export async function processIncomingComplaint(
  constituencyId: string,
  text: string,
  source: Complaint['source'],
  submittedBy: string,
  declaredProfile?: SubmitterProfile,
  photoAnalysis?: string,
): Promise<NewComplaintResult> {
  const state = getDashboardState(constituencyId);
  const issuesForMatch = state.issues.map((i) => ({
    id: i.id,
    title: i.title,
    category: i.category,
    ward: i.ward,
  }));

  const result = await classifyAndMatch(text, issuesForMatch, photoAnalysis);

  const submitterProfile: SubmitterProfile = declaredProfile ?? result.submitterProfile;
  const profileSource: ProfileSource = declaredProfile
    ? 'declared'
    : submitterProfile === 'farmer'
      ? 'inferred'
      : 'default';

  return registerComplaint(constituencyId, {
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
    submitterProfile,
    profileSource,
    photoAnalysis,
  });
}
