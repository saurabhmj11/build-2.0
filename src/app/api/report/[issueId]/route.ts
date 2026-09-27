import { NextRequest, NextResponse } from 'next/server';
import { generateReport } from '@/lib/ai';
import {
  getComplaintsForIssue,
  getIssueById,
  getReportCache,
  setReportCache,
} from '@/lib/store';
import { LIVE_CONSTITUENCY_IDS } from '@/lib/constituencies';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Generate (and cache) the department action report for one issue.
 * Cache key includes the cluster's complaint count so growing clusters
 * regenerate the report.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  try {
    const { issueId } = await params;
    const constituencyId = req.nextUrl.searchParams.get('c') ?? 'nagpur';
    if (!LIVE_CONSTITUENCY_IDS.includes(constituencyId)) {
      return NextResponse.json({ error: `Unknown constituency "${constituencyId}".` }, { status: 400 });
    }

    const issue = getIssueById(constituencyId, issueId);
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found.' }, { status: 404 });
    }

    const complaints = getComplaintsForIssue(constituencyId, issueId);
    const cacheKey = `${issueId}:${issue.count}`;
    const cached = getReportCache(constituencyId, cacheKey);
    if (cached) {
      return NextResponse.json({ ok: true, report: cached.report, cached: true });
    }

    const report = await generateReport(issue, complaints, issue.mplads);
    setReportCache(constituencyId, cacheKey, report, issue.count);

    return NextResponse.json({ ok: true, report, cached: false });
  } catch (err) {
    console.error('[api/report] failed:', err);
    return NextResponse.json(
      { error: 'Report generation failed. Please try again.' },
      { status: 500 },
    );
  }
}
