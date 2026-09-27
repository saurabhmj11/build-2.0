import { NextRequest, NextResponse } from 'next/server';
import { getDashboardState } from '@/lib/store';
import { processIncomingComplaint } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Citizen submits a complaint (any language, any channel).
 * Runs the live LLM pipeline: classify → translate → urgency → cluster match.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: string;
      submittedBy?: string;
      source?: string;
    };

    const text = (body.text ?? '').trim();
    if (!text) {
      return NextResponse.json(
        { error: 'Complaint text is required.' },
        { status: 400 },
      );
    }
    if (text.length > 2000) {
      return NextResponse.json(
        { error: 'Complaint text too long (max 2000 characters).' },
        { status: 400 },
      );
    }

    const source = ['WhatsApp', 'Phone', 'Letter', 'Walk-in', 'App', 'Voice note'].includes(
      body.source ?? '',
    )
      ? (body.source as 'WhatsApp' | 'Phone' | 'Letter' | 'Walk-in' | 'App' | 'Voice note')
      : 'App';

    const result = await processIncomingComplaint(
      text,
      source,
      (body.submittedBy ?? 'Anonymous citizen').trim() || 'Anonymous citizen',
    );

    return NextResponse.json({
      ok: true,
      complaint: result.complaint,
      isNewIssue: result.isNewIssue,
      state: getDashboardState(),
    });
  } catch (err) {
    console.error('[api/complaints] failed:', err);
    return NextResponse.json(
      { error: 'Could not process complaint. Please try again.' },
      { status: 500 },
    );
  }
}
