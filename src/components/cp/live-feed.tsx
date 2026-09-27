'use client';

import { Inbox, Languages, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Complaint } from '@/lib/types';
import { CATEGORY_STYLE, SOURCE_ICON, timeAgo, urgencyStyle } from '@/lib/client-format';

interface LiveFeedProps {
  complaints: Complaint[];
  processing: boolean;
}

/** Complaints younger than this stay highlighted as "just arrived". */
const FRESH_WINDOW_MS = 45_000;

function FeedItem({ complaint }: { complaint: Complaint }) {
  const Icon = SOURCE_ICON[complaint.source] ?? SOURCE_ICON.App;
  const urg = urgencyStyle(complaint.urgency);
  const isNew = Date.now() - new Date(complaint.createdAt).getTime() < FRESH_WINDOW_MS;
  return (
    <article
      className={`cp-slide-in rounded-lg border p-3 ${
        isNew
          ? 'border-emerald-400 bg-emerald-50/60 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate font-medium text-slate-700">{complaint.submittedBy}</span>
        </div>
        <time className="shrink-0" dateTime={complaint.createdAt}>
          {timeAgo(complaint.createdAt)}
        </time>
      </div>

      <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-slate-800" lang={complaint.language === 'English' ? 'en' : undefined}>
        {complaint.textOriginal}
      </p>
      <p className="mt-1 line-clamp-2 border-l-2 border-emerald-300 pl-2 text-[12px] italic leading-snug text-slate-500">
        {complaint.translationEn}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className={`px-1.5 py-0 text-[10px] font-semibold ${CATEGORY_STYLE[complaint.category]}`}
        >
          {complaint.category}
        </Badge>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${urg.cls}`}
          title={`Urgency ${complaint.urgency}/5`}
        >
          U{complaint.urgency} {urg.label}
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          <Languages className="h-2.5 w-2.5" aria-hidden />
          {complaint.language}
        </span>
        {complaint.aiClassified && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
            <Sparkles className="h-2.5 w-2.5" aria-hidden />
            AI classified
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
      className="flex max-h-[calc(100vh-13rem)] min-h-[420px] flex-col rounded-xl border border-slate-200 bg-slate-50/60 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-slate-500" aria-hidden />
          <h2 className="text-sm font-bold text-slate-800">Live intake</h2>
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
            </span>
            WhatsApp · calls · letters · walk-ins
          </span>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm">
          {complaints.length}
        </span>
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <div className="flex flex-col gap-2.5">
          {processing && (
            <div className="animate-pulse rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/50 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Incoming complaint — AI translating &amp; classifying…
              </p>
              <div className="mt-2 space-y-1.5">
                <div className="h-2 w-full rounded bg-emerald-200/70" />
                <div className="h-2 w-4/5 rounded bg-emerald-200/50" />
              </div>
            </div>
          )}
          {complaints.map((c) => (
            <FeedItem key={c.id} complaint={c} />
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}
