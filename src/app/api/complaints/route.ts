import { NextRequest, NextResponse } from 'next/server';
import { getDashboardState } from '@/lib/store';
import { processIncomingComplaint } from '@/lib/pipeline';
import { LIVE_CONSTITUENCY_IDS } from '@/lib/constituencies';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Citizen submits a complaint (any language, any channel) into a constituency.
 * Runs the live LLM pipeline: classify → translate → urgency → cluster match.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: string;
      submittedBy?: string;
      source?: string;
      constituencyId?: string;
      /** Module 5 — self-declared occupation ('farmer' | 'general'); absent = infer from text */
      submitterProfile?: string;
      /** Module 7 — AI vision analysis of an attached photo (evidence) */
      photoAnalysis?: string;
    };

    const constituencyId = body.constituencyId ?? 'nagpur';
    if (!LIVE_CONSTITUENCY_IDS.includes(constituencyId)) {
      return NextResponse.json(
        { error: `Unknown constituency "${constituencyId}".` },
        { status: 400 },
      );
    }

    const text = (body.text ?? '').trim();
    const photoAnalysis = body.photoAnalysis?.trim() || undefined;
    if (!text && !photoAnalysis) {
      return NextResponse.json(
        { error: 'Describe the problem or attach a photo first.' },
        { status: 400 },
      );
    }
    if (text.length > 2000) {
      return NextResponse.json(
        { error: 'Complaint text too long (max 2000 characters).' },
        { status: 400 },
      );
    }
    // Photo-only intake: the vision analysis stands in as the complaint text
    // so a citizen with a camera and no words still gets classified.
    const effectiveText = text || (photoAnalysis ?? '');

    const source = ['WhatsApp', 'Phone', 'Letter', 'Walk-in', 'App', 'Voice note'].includes(
      body.source ?? '',
    )
      ? (body.source as 'WhatsApp' | 'Phone' | 'Letter' | 'Walk-in' | 'App' | 'Voice note')
      : 'App';

    const declaredProfile =
      body.submitterProfile === 'farmer' || body.submitterProfile === 'general'
        ? body.submitterProfile
        : undefined;

    const result = await processIncomingComplaint(
      constituencyId,
      effectiveText,
      source,
      (body.submittedBy ?? 'Anonymous citizen').trim() || 'Anonymous citizen',
      declaredProfile,
      photoAnalysis,
    );

    return NextResponse.json({
      ok: true,
      complaint: result.complaint,
      isNewIssue: result.isNewIssue,
      state: getDashboardState(constituencyId),
    });
  } catch (err) {
    console.error('[api/complaints] failed:', err);
    return NextResponse.json(
      { error: 'Could not process complaint. Please try again.' },
      { status: 500 },
    );
  }
}
