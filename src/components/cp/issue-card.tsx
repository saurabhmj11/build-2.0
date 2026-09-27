'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  FileText,
  MapPin,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Complaint, IssueView } from '@/lib/types';
import {
  CATEGORY_STYLE,
  SOURCE_ICON,
  timeAgo,
  urgencyStyle,
  MPLADS_STATUS_STYLE,
} from '@/lib/client-format';

interface IssueCardProps {
  issue: IssueView;
  rank: number;
  maxPriority: number;
  complaints: Complaint[];
  onGenerateReport: (issue: IssueView) => void;
}

function CountBadge({ count }: { count: number }) {
  // key={count} on the consumer remounts this badge whenever the cluster grows,
  // replaying the one-shot pop animation — the "N citizens reported this" moment.
  return (
    <span className="cp-count-pop inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
      <Users className="h-3.5 w-3.5" aria-hidden />
      {count} {count === 1 ? 'citizen' : 'citizens'} reported
    </span>
  );
}

export function IssueCard({
  issue,
  rank,
  maxPriority,
  complaints,
  onGenerateReport,
}: IssueCardProps) {
  const [open, setOpen] = useState(false);
  const urg = urgencyStyle(issue.urgency);

  const pct = maxPriority > 0 ? Math.round((issue.priority / maxPriority) * 100) : 0;
  const mpl = issue.mplads;
  const isTop = rank === 1;

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        isTop ? 'border-emerald-300' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        {/* Rank + priority */}
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:gap-1">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-extrabold ${
              isTop ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
            }`}
            aria-label={`Rank ${rank}`}
          >
            #{rank}
          </span>
          <div className="sm:text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Priority
            </p>
            <p className="text-lg font-extrabold leading-none text-slate-800">
              {issue.priority}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-bold leading-snug text-slate-900">
              {issue.title}
            </h3>
          </div>

          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            {issue.ward} · {issue.location}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <CountBadge key={issue.count} count={issue.count} />
            {issue.recentCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                +{issue.recentCount} in last hour
              </span>
            )}
            <Badge
              variant="outline"
              className={`px-1.5 py-0 text-[10px] font-semibold ${CATEGORY_STYLE[issue.category]}`}
            >
              {issue.category}
            </Badge>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${urg.cls}`}
              title={`Urgency ${issue.urgency}/5`}
            >
              Urgency {issue.urgency} · {urg.label}
            </span>
          </div>

          {/* Priority bar */}
          <div className="mt-2.5 flex items-center gap-2">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={issue.priority}
              aria-valuemin={0}
              aria-valuemax={maxPriority}
              aria-label="Priority score relative to top issue"
            >
              <div
                className={`h-full rounded-full ${isTop ? 'bg-emerald-600' : 'bg-slate-400'}`}
                style={{ width: `${Math.max(6, pct)}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-medium text-slate-400">
              {issue.count} × urgency {issue.urgency}
            </span>
          </div>

          {/* MPLADS cross-reference */}
          {mpl ? (
            <div
              className={`mt-3 rounded-lg border p-2.5 text-xs leading-relaxed ${
                mpl.status === 'Delayed'
                  ? 'border-red-200 bg-red-50'
                  : mpl.status === 'Completed'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-amber-200 bg-amber-50/70'
              }`}
            >
              <p className="flex items-start gap-1.5 font-semibold text-slate-800">
                <AlertTriangle
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    mpl.status === 'Delayed' ? 'text-red-600' : 'text-amber-600'
                  }`}
                  aria-hidden
                />
                Already sanctioned ₹{mpl.amountLakh}L on {mpl.sanctionDate} — status:{' '}
                <span className="whitespace-nowrap">{mpl.status}</span>
              </p>
              <p className="mt-0.5 pl-5 text-slate-600">
                “{mpl.workName}” · {mpl.implementingAgency}
              </p>
              <p className="mt-0.5 pl-5 font-medium text-slate-700">
                {mpl.status === 'Delayed'
                  ? '→ Unfulfilled sanctioned work: needs follow-up, not new budget.'
                  : mpl.status === 'Completed'
                    ? '→ Work marked completed but complaints continue: escalate for audit.'
                    : '→ Ongoing sanctioned work: verify progress on the ground.'}
              </p>
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-500">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              No sanctioned MPLADS work on record — treat as a fresh, unfunded issue.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 border-slate-300 px-2.5 text-xs font-semibold text-slate-600"
              >
                {issue.count} complaints
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          <Button
            size="sm"
            onClick={() => onGenerateReport(issue)}
            className="h-8 gap-1.5 bg-emerald-700 px-2.5 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Generate report
          </Button>
        </div>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleContent>
          <div className="max-h-72 space-y-2 overflow-y-auto border-t border-slate-100 bg-slate-50/50 px-4 py-3">
            {complaints.map((c) => {
              const Icon = SOURCE_ICON[c.source] ?? SOURCE_ICON.App;
              return (
                <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <Icon className="h-3 w-3" aria-hidden />
                      {c.submittedBy} · {c.ward} · {c.language}
                    </span>
                    <time dateTime={c.createdAt}>{timeAgo(c.createdAt)}</time>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-slate-800">{c.textOriginal}</p>
                  <p className="mt-0.5 text-xs italic leading-snug text-slate-500">
                    {c.translationEn}
                  </p>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </article>
  );
}
