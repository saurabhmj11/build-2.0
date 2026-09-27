import { NextResponse } from 'next/server';
import { getDashboardState, nextPoolItem } from '@/lib/store';
import { processIncomingComplaint } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Demo simulation: pull the next complaint from the live-feed pool and run it
 * through the real LLM pipeline (classify → cluster match). Client paces this.
 */
export async function POST() {
  try {
    const item = nextPoolItem();
    if (!item) {
      return NextResponse.json({ ok: false, exhausted: true, state: getDashboardState() });
    }

    const result = await processIncomingComplaint(item.text, item.source, item.submittedBy);

    return NextResponse.json({
      ok: true,
      exhausted: false,
      complaint: result.complaint,
      isNewIssue: result.isNewIssue,
      state: getDashboardState(),
    });
  } catch (err) {
    console.error('[api/demo/next] failed:', err);
    return NextResponse.json(
      { ok: false, error: 'Live feed step failed.' },
      { status: 500 },
    );
  }
}
