import { NextResponse } from 'next/server';
import { getDashboardState } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getDashboardState());
}
