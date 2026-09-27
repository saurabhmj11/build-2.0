'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Complaint, IssueView } from '@/lib/types';
import { categoryWeight, weightRationale } from '@/lib/profile';
import {
  CATEGORY_STYLE,
  DISPUTED_HEX,
  formatPriority,
  maskSubmitterId,
  MPLADS_STATUS_LABEL,
  shortDate,
  SOURCE_EMOJI,
  timeAgo,
  urgencyStyle,
} from '@/lib/client-format';

interface IssueCardProps {
  issue: IssueView;
  rank: number;
  maxPriority: number;
  complaints: Complaint[];
  onGenerateReport: (issue: IssueView) => void;
}

function CountHero({ count, distinct }: { count: number; distinct: number }) {
  // key remount replays the pop animation when the cluster genuinely grows
  return (
    <span
      key={distinct}
      className="cp-count-pop inline-flex items-baseline gap-1.5"
    >
      <span className="text-2xl font-extrabold leading-none text-white">
        {count}
      </span>
      <span className="text-xs font-semibold text-gray-400">
        {count === 1 ? 'report' : 'reports'}
      </span>
      <span className="text-xs text-gray-500">
        · from <b className="text-gray-300">{distinct}</b> distinct{' '}
        {distinct === 1 ? 'citizen' : 'citizens'}
      </span>
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
  const v = issue.verification;
  const mpl = issue.mplads;
  const isTop = rank === 1;
  const deWeighted = issue.rawPriority > issue.priority;
  const pct = maxPriority > 0 ? Math.round((issue.priority / maxPriority) * 100) : 0;
  const isFarmerWeighted = issue.profile === 'farmer' && issue.profileWeight !== 1;
  const generalWeight = categoryWeight('general', issue.category);
  const counterfactual =
    Math.round(issue.unweightedPriority * generalWeight * 10) / 10;

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-[#1F2937] transition-colors ${
        isTop ? 'border-gray-500' : 'border-[#374151]'
      } hover:border-gray-500`}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        {/* 1 — urgency color bar + rank (left edge) */}
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:gap-1.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-extrabold"
            style={{
              backgroundColor: `${urg.hex}22`,
              color: urg.hex,
              boxShadow: `inset 0 0 0 1.5px ${urg.hex}`,
            }}
            aria-label={`Rank ${rank} · urgency ${issue.urgency} of 5`}
          >
            #{rank}
          </span>
          <div className="sm:text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">
              Priority
            </p>
            <p className="text-lg font-extrabold leading-none text-white">
              {formatPriority(issue.priority)}
            </p>
          </div>
        </div>

        {/* 2–5 — title, hero count, pills, location */}
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold leading-snug text-white">
            {issue.title}
          </h3>

          <div className="mt-1.5">
            <CountHero count={issue.count} distinct={issue.distinctCount} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_STYLE[issue.category]}`}
            >
              {issue.category}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: urg.hex }}
              title={`Urgency ${issue.urgency}/5`}
            >
              Urgency {issue.urgency} · {urg.label}
            </span>
            {isFarmerWeighted && (
              <span
                className="rounded-full border border-lime-700/70 bg-lime-950/40 px-2 py-0.5 text-[10px] font-bold text-lime-400"
                title={`${issue.farmerCount} of ${issue.distinctCount} distinct complainants are identified farmers (self-declared or inferred from their own words). ${weightRationale('farmer', issue.category)} Unweighted score ${formatPriority(issue.unweightedPriority)} → ${formatPriority(issue.priority)} with the farmer weight (×${issue.profileWeight} vs ×${generalWeight} general). As general reporters this cluster would score ${formatPriority(counterfactual)}.`}
              >
                🌾 farmer-weighted ×{issue.profileWeight}
              </span>
            )}
            {issue.recentCount > 0 && (
              <span className="rounded-full bg-[#374151] px-2 py-0.5 text-[10px] font-bold text-amber-400">
                +{issue.recentCount} in last hour
              </span>
            )}
            {deWeighted && (
              <span
                className="rounded-full border border-amber-700/70 bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-400"
                title="Raw volume would have scored this higher — the verification layer de-weighted it"
              >
                raw {formatPriority(issue.rawPriority)} → verified {formatPriority(issue.priority)}
              </span>
            )}
            {issue.quarantined && (
              <span
                className="rounded-full border border-amber-600 bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-300"
                title="Suspected coordinated campaign — ranking quarantined pending human review"
              >
                📋 quarantined — rank capped at urgency
              </span>
            )}
          </div>

          <p className="mt-1.5 text-xs text-gray-500">
            📍 {issue.ward} · {issue.location}
          </p>

          {/* priority bar */}
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-1 min-w-20 flex-1 overflow-hidden rounded-full bg-[#374151]"
              role="progressbar"
              aria-valuenow={issue.priority}
              aria-valuemin={0}
              aria-valuemax={maxPriority}
              aria-label="Verified priority score relative to top issue"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(6, pct)}%`,
                  backgroundColor: urg.hex,
                }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-medium text-gray-500">
              {issue.quarantined ? 'urgency only' : `${issue.distinctCount} distinct`} ×
              urgency {issue.urgency}
              {issue.profileWeight !== 1 &&
                ` × ${issue.profileWeight} (${issue.profile === 'farmer' ? 'farmer' : 'general'})`}
            </span>
          </div>

          {/* 6 — MPLADS strip: disputed OR sanctioned OR clean-completed OR none.
              A card is either "disputed" or "sanctioned/ongoing/delayed", never both. */}
          {issue.disputed && mpl ? (
            <div
              className="mt-3 rounded-lg p-2.5 text-xs leading-relaxed"
              style={{
                backgroundColor: `${DISPUTED_HEX}1f`,
                boxShadow: `inset 0 0 0 1.5px ${DISPUTED_HEX}`,
              }}
            >
              <p className="font-bold" style={{ color: '#f472a0' }}>
                🚩 DISPUTED — marked complete on {shortDate(mpl.completionDate!)},
                but {issue.reportsSinceCompletion}{' '}
                {issue.reportsSinceCompletion === 1 ? 'report' : 'reports'} since say
                otherwise
              </p>
              <p className="mt-1 text-gray-300">
                Sanctioned ₹{mpl.amountLakh}L on {shortDate(mpl.sanctionDate)} · “
                {mpl.workName}” · {mpl.implementingAgency}
              </p>
              {mpl.quality && (
                <p
                  className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md bg-red-950/50 px-2 py-1 font-semibold"
                  style={{ color: '#F87171' }}
                  title="Post-completion rating: 60% phone-verified citizen ratings + 40% third-party engineer inspection"
                >
                  ⭐ Rated {mpl.quality.composite.toFixed(1)}/5 ({mpl.quality.band}) —
                  {mpl.quality.citizenResponses} citizens{' '}
                  {mpl.quality.citizenResponses === 1 ? 'rates' : 'rate'} it{' '}
                  {mpl.quality.citizenRating.toFixed(1)}/5 · inspection{' '}
                  {mpl.quality.inspectionScore.toFixed(1)}/5
                  <span className="font-bold text-red-300">
                    — corroborates the dispute
                  </span>
                </p>
              )}
              <p className="mt-0.5 font-medium" style={{ color: '#f472a0' }}>
                → Official record vs. ground reports mismatch — physical
                verification recommended. Not hidden as “resolved”.
              </p>
            </div>
          ) : mpl ? (
            <div
              className={`mt-3 rounded-lg border border-dashed p-2.5 text-xs leading-relaxed ${
                mpl.status === 'Completed'
                  ? 'border-emerald-700/70 bg-emerald-950/25'
                  : 'border-amber-700/80 bg-amber-950/20'
              }`}
            >
              <p
                className={`flex flex-wrap items-baseline gap-x-1 font-bold ${
                  mpl.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {mpl.status === 'Completed' ? '✓' : '⚠️'}{' '}
                {mpl.status === 'Completed'
                  ? `Completed on ${shortDate(mpl.completionDate!)} — no reports since`
                  : `Already sanctioned ₹${mpl.amountLakh}L on ${shortDate(mpl.sanctionDate)} — status: ${MPLADS_STATUS_LABEL[mpl.status]}`}
              </p>
              <p className="mt-1 text-gray-400">
                “{mpl.workName}” · {mpl.implementingAgency}
              </p>
              {/* Module 6 — fund drawn + physical progress on the ground */}
              {mpl.status !== 'Completed' && mpl.progressPct !== undefined && (
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-400">
                  <span>
                    ₹{mpl.spentLakh ?? 0}L drawn of ₹{mpl.amountLakh}L
                  </span>
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#111827]">
                    <span
                      className="block h-full rounded-full bg-emerald-600"
                      style={{ width: `${Math.min(100, ((mpl.spentLakh ?? 0) / mpl.amountLakh) * 100)}%` }}
                    />
                  </span>
                  <span>
                    {mpl.progressPct}% done on the ground
                    {mpl.status === 'Delayed' && (
                      <span className="ml-1 font-bold text-orange-400">
                        — behind schedule
                      </span>
                    )}
                  </span>
                </p>
              )}
              {/* Module 6 — post-completion citizen quality rating (clean case) */}
              {mpl.status === 'Completed' && mpl.quality && (
                <p
                  className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-md bg-emerald-950/40 px-2 py-1 text-[11px] font-semibold text-emerald-400"
                  title="Post-completion rating: 60% phone-verified citizen ratings + 40% third-party engineer inspection"
                >
                  ⭐ Rated {mpl.quality.composite.toFixed(1)}/5 ({mpl.quality.band}) —
                  {mpl.quality.citizenResponses} citizens{' '}
                  {mpl.quality.citizenResponses === 1 ? 'rates' : 'rate'} it{' '}
                  {mpl.quality.citizenRating.toFixed(1)}/5 · inspection{' '}
                  {mpl.quality.inspectionScore.toFixed(1)}/5
                </p>
              )}
              <p className="mt-0.5 font-medium text-gray-300">
                {mpl.status === 'Delayed'
                  ? '→ Unfulfilled sanctioned work: needs follow-up, not new budget.'
                  : mpl.status === 'Completed'
                    ? '→ Completion consistent with ground reports — verified clean.'
                    : mpl.status === 'Ongoing'
                      ? '→ Ongoing sanctioned work: verify progress on the ground.'
                      : '→ Sanctioned but not started: ask why work orders are pending.'}
              </p>
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-[#374151] bg-[#111827]/60 p-2.5 text-xs font-medium text-gray-500">
              No sanctioned MPLADS work on record — treat as a fresh, unfunded issue.
            </p>
          )}

          {/* Module 4a — coordinated-campaign flag */}
          {v.coordinationSuspected && (
            <div className="mt-2 rounded-lg border border-amber-700/70 bg-amber-950/30 p-2.5 text-xs leading-relaxed">
              <p className="font-bold text-amber-300">
                ⚠️ Suspected coordinated campaign — {v.templatedGroupSize} of{' '}
                {issue.count} complaints share near-identical templated wording
                across different phone ids ({v.templatedGroupSubmitters.join(', ')}
                ) within a short window.
              </p>
              <p className="mt-0.5 text-amber-200/80">
                → Different check from duplicate clustering: these are{' '}
                <span className="font-semibold">suspiciously identical</span>{' '}
                texts, not different people describing the same problem.
                Quarantined from ranking pending human review.
              </p>
            </div>
          )}

          {/* Module 4a — repeat submitters note */}
          {v.duplicateSubmitters.length > 0 && (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-[#374151] bg-[#111827]/60 px-2.5 py-1.5 text-[11px] font-medium text-gray-400">
              Repeat submitters (de-weighted — one citizen, one vote):
              {v.duplicateSubmitters.map((d) => (
                <span
                  key={d.name}
                  className="rounded-full bg-[#374151] px-1.5 py-0.5 font-semibold text-gray-200"
                >
                  {d.name} ×{d.times}
                </span>
              ))}
            </p>
          )}
        </div>

        {/* 7 — actions */}
        <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
          <Button
            size="sm"
            onClick={() => onGenerateReport(issue)}
            className="h-8 gap-1.5 bg-amber-600 px-2.5 text-xs font-semibold text-white hover:bg-amber-500"
          >
            🏛️ Generate report
          </Button>
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 border-[#374151] bg-transparent px-2.5 text-xs font-semibold text-gray-400 hover:bg-[#374151] hover:text-white"
              >
                {issue.count} complaints
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleContent>
          <div className="max-h-72 space-y-2 overflow-y-auto border-t border-[#374151] bg-[#111827]/50 px-4 py-3">
            {complaints.map((c) => (
              <div key={c.id} className="rounded-lg border border-[#374151] bg-[#1F2937] p-2.5">
                <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1.5 font-medium text-gray-400">
                    <span aria-hidden>{SOURCE_EMOJI[c.source] ?? '📱'}</span>
                    {c.submittedBy}{' '}
                    <span className="font-mono text-gray-600">
                      ({maskSubmitterId(c.submitterId)})
                    </span>{' '}
                    · {c.ward} · {c.language}
                    {c.submitterProfile === 'farmer' && (
                      <span
                        className="rounded-sm bg-lime-950/70 px-1 py-px font-bold text-lime-400 ring-1 ring-lime-800"
                        title={
                          c.profileSource === 'declared'
                            ? 'Occupation self-declared at intake'
                            : 'Occupation inferred from the complaint text'
                        }
                      >
                        🌾 farmer
                      </span>
                    )}
                  </span>
                  <time dateTime={c.createdAt}>{timeAgo(c.createdAt)}</time>
                </div>
                <p className="mt-1 text-[13px] leading-snug text-gray-200">
                  {c.textOriginal}
                </p>
                <p className="mt-0.5 text-xs italic leading-snug text-gray-500">
                  {c.translationEn}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </article>
  );
}
