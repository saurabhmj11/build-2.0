import { NextRequest, NextResponse } from 'next/server';
import { generateReport } from '@/lib/ai';
import {
  getComplaintsForIssue,
  getIssueById,
  getReportCache,
  setReportCache,
} from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Generate (and cache) the department action report for one issue.
 * Cache key includes the cluster's complaint count so growing clusters
 * regenerate the report.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  try {
    const { issueId } = await params;
    const issue = getIssueById(issueId);
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found.' }, { status: 404 });
    }

    const complaints = getComplaintsForIssue(issueId);
    const cacheKey = `${issueId}:${issue.count}`;
    const cached = getReportCache(cacheKey);
    if (cached) {
      return NextResponse.json({ ok: true, report: cached.report, cached: true });
    }

    const report = await generateReport(issue, complaints, issue.mplads);
    setReportCache(cacheKey, report, issue.count);

    return NextResponse.json({ ok: true, report, cached: false });
  } catch (err) {
    console.error('[api/report] failed:', err);
    return NextResponse.json(
      { error: 'Report generation failed. Please try again.' },
      { status: 500 },
    );
  }
}
