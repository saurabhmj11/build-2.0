import { NextRequest, NextResponse } from 'next/server';
import { getDashboardState, nextPoolItem } from '@/lib/store';
import { processIncomingComplaint } from '@/lib/pipeline';
import { LIVE_CONSTITUENCY_IDS } from '@/lib/constituencies';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Demo simulation: pull the next complaint from this constituency's live pool
 * and run it through the real LLM pipeline. Client paces this.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { constituencyId?: string };
    const constituencyId = body.constituencyId ?? 'nagpur';
    if (!LIVE_CONSTITUENCY_IDS.includes(constituencyId)) {
      return NextResponse.json({ ok: false, error: `Unknown constituency "${constituencyId}".` }, { status: 400 });
    }

    const item = nextPoolItem(constituencyId);
    if (!item) {
      return NextResponse.json({
        ok: false,
        exhausted: true,
        state: getDashboardState(constituencyId),
      });
    }

    const result = await processIncomingComplaint(
      constituencyId,
      item.text,
      item.source,
      item.submittedBy,
    );

    return NextResponse.json({
      ok: true,
      exhausted: false,
      complaint: result.complaint,
      isNewIssue: result.isNewIssue,
      state: getDashboardState(constituencyId),
    });
  } catch (err) {
    console.error('[api/demo/next] failed:', err);
    return NextResponse.json(
      { ok: false, error: 'Live feed step failed.' },
      { status: 500 },
    );
  }
}
