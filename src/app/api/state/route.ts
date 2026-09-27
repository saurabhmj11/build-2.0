import { NextRequest, NextResponse } from 'next/server';
import { getDashboardState } from '@/lib/store';
import { LIVE_CONSTITUENCY_IDS } from '@/lib/constituencies';

export const dynamic = 'force-dynamic';

/**
 * Dashboard state for ONE constituency (tenant key, ARCHITECTURE.md).
 * `?c=<id>` — defaults to the Nagpur pilot when absent (e.g. direct API hits).
 */
export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get('c') ?? 'nagpur';
  if (!LIVE_CONSTITUENCY_IDS.includes(c)) {
    return NextResponse.json(
      { error: `Unknown constituency "${c}". Live pilots: ${LIVE_CONSTITUENCY_IDS.join(', ')}.` },
      { status: 400 },
    );
  }
  return NextResponse.json(getDashboardState(c));
}
