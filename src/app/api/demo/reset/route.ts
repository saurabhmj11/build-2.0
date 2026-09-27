import { NextResponse } from 'next/server';
import { getDashboardState, resetStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** Reset the demo back to the seeded state (handy right before a pitch). */
export async function POST() {
  resetStore();
  return NextResponse.json({ ok: true, state: getDashboardState() });
}
