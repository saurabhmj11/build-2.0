import { NextRequest, NextResponse } from 'next/server';
import { getDashboardState, resetStore } from '@/lib/store';
import { LIVE_CONSTITUENCY_IDS } from '@/lib/constituencies';

export const dynamic = 'force-dynamic';

/** Reset ONE constituency's demo back to its seeded state (handy right before a pitch). */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { constituencyId?: string };
  const constituencyId = body.constituencyId ?? 'nagpur';
  if (!LIVE_CONSTITUENCY_IDS.includes(constituencyId)) {
    return NextResponse.json({ ok: false, error: `Unknown constituency "${constituencyId}".` }, { status: 400 });
  }
  resetStore(constituencyId);
  return NextResponse.json({ ok: true, state: getDashboardState(constituencyId) });
}
