import { NextRequest, NextResponse } from 'next/server';
import { analyzePhoto } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

/**
 * Module 7 — photo evidence analysis (backend-only z-ai-web-dev-sdk vision).
 * The client uploads a data-URL; the VLM returns a structured description the
 * classifier then consumes as ground-truth evidence.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { image?: string };
    const image = body.image ?? '';

    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image — expected a data URL (png/jpeg/webp).' },
        { status: 400 },
      );
    }
    // ~6 MB of base64 ≈ 4.5 MB of image — plenty for a phone photo
    if (image.length > 6_000_000) {
      return NextResponse.json(
        { error: 'Photo too large — please attach an image under 4 MB.' },
        { status: 413 },
      );
    }

    const analysis = await analyzePhoto(image);
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    console.error('[api/photo] failed:', err);
    return NextResponse.json(
      { error: 'Could not analyze the photo. You can still submit without it.' },
      { status: 500 },
    );
  }
}
