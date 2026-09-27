'use client';

import { Complaint } from '@/lib/types';
import {
  maskSubmitterId,
  SOURCE_EMOJI,
  timeAgo,
  urgencyStyle,
} from '@/lib/client-format';

interface LiveFeedProps {
  complaints: Complaint[];
  processing: boolean;
}

/** Complaints younger than this stay highlighted as "just arrived". */
const FRESH_WINDOW_MS = 45_000;

function FeedItem({ complaint }: { complaint: Complaint }) {
  const urg = urgencyStyle(complaint.urgency);
  const isNew = Date.now() - new Date(complaint.createdAt).getTime() < FRESH_WINDOW_MS;
  return (
    <article
      className={`cp-slide-in rounded-md border-l-[3px] py-2 pl-2.5 pr-2 ${
        isNew
          ? 'bg-[#2b3546] ring-1 ring-amber-600/40'
          : 'bg-[#1F2937]/60'
      }`}
      style={{ borderLeftColor: urg.hex }}
    >
      {/* Raw complaint text, exactly as received — the mess IS the pitch */}
      <p
        className="line-clamp-2 text-[13px] leading-snug text-gray-200"
        lang={complaint.language === 'English' ? 'en' : undefined}
      >
        🗣 {complaint.textOriginal}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-gray-500">
        <span>📍 {complaint.ward}</span>
        <time dateTime={complaint.createdAt}>{timeAgo(complaint.createdAt)}</time>
        <span aria-hidden>{SOURCE_EMOJI[complaint.source] ?? '📱'} {complaint.source}</span>
        <span className="font-mono">{maskSubmitterId(complaint.submitterId)}</span>
        <span>{complaint.language}</span>
        {complaint.submitterProfile === 'farmer' && (
          <span
            className="rounded-sm bg-lime-950/70 px-1 py-px font-bold text-lime-400 ring-1 ring-lime-800"
            title={
              complaint.profileSource === 'declared'
                ? 'Occupation self-declared at intake'
                : complaint.profileSource === 'inferred'
                  ? 'Occupation inferred from the complaint text'
                  : undefined
            }
          >
            🌾 farmer
          </span>
        )}
        {complaint.photoAnalysis && (
          <span
            className="cursor-help rounded-sm bg-teal-950/70 px-1 py-px font-bold text-teal-300 ring-1 ring-teal-800"
            title={`AI vision analysis of the attached photo: ${complaint.photoAnalysis}`}
          >
            📷 photo
          </span>
        )}
        {complaint.aiClassified && (
          <span className="rounded-sm bg-amber-950/70 px-1 py-px font-bold text-amber-400 ring-1 ring-amber-800">
            AI
          </span>
        )}
      </div>
    </article>
  );
}

export function LiveFeed({ complaints, processing }: LiveFeedProps) {
  return (
    <section
      aria-label="Live complaint intake feed"
      className="flex max-h-[calc(100vh-9.5rem)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-[#374151] bg-[#1F2937]/40"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#374151] px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white">Incoming feed</h2>
          <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
            </span>
            raw · multilingual · as received
          </span>
        </div>
        <span className="rounded-full bg-[#374151] px-2 py-0.5 text-[11px] font-semibold text-gray-300">
          {complaints.length}
        </span>
      </div>

      <div className="cp-scroll flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2.5">
        {processing && (
          <div className="animate-pulse rounded-md border-2 border-dashed border-amber-700/60 bg-amber-950/20 p-3">
            <p className="text-xs font-semibold text-amber-400">
              ⚡ Incoming complaint — AI translating &amp; classifying…
            </p>
            <div className="mt-2 space-y-1.5">
              <div className="h-2 w-full rounded bg-amber-900/50" />
              <div className="h-2 w-4/5 rounded bg-amber-900/40" />
            </div>
          </div>
        )}
        {complaints.map((c) => (
          <FeedItem key={c.id} complaint={c} />
        ))}
      </div>
    </section>
  );
}
