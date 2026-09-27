'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FundSummary, MpladsRecord, QualityBand } from '@/lib/types';
import {
  formatLakh,
  MPLADS_STATUS_LABEL,
  QUALITY_BAND_STYLE,
  QUALITY_HEX,
  shortDate,
} from '@/lib/client-format';

interface FundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fund: FundSummary;
  works: MpladsRecord[];
  constituencyName: string;
}

/** ★★★☆☆ + numeric label. */
function Stars({ rating, tone = 'amber' }: { rating: number; tone?: 'amber' | 'sky' }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  const color = tone === 'amber' ? 'text-amber-400' : 'text-sky-400';
  return (
    <span className={`font-mono text-sm tracking-tight ${color}`} aria-label={`${rating.toFixed(1)} of 5`}>
      {'★'.repeat(filled)}
      <span className="text-gray-600">{'★'.repeat(5 - filled)}</span>
    </span>
  );
}

function BandBadge({ band }: { band: QualityBand }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${QUALITY_BAND_STYLE[band]}`}
    >
      {band === 'Poor' ? '⚠ Quality alert' : band}
    </span>
  );
}

const STATUS_STYLE: Record<string, string> = {
  Completed: 'bg-emerald-950/50 text-emerald-400 ring-1 ring-emerald-800',
  Ongoing: 'bg-teal-950/50 text-teal-300 ring-1 ring-teal-800',
  Delayed: 'bg-orange-950/50 text-orange-400 ring-1 ring-orange-800',
  'Sanctioned – not started': 'bg-zinc-800 text-zinc-400 ring-1 ring-zinc-600',
};

const STATUS_BAR_HEX: Record<string, string> = {
  Completed: '#10B981',
  Ongoing: '#2DD4BF',
  Delayed: '#EA580C',
  'Sanctioned – not started': '#6B7280',
};

/**
 * Module 6 — the full MPLADS fund utilisation & work-quality ledger:
 * Tab 1 money in/out (GoI tranches → works → utilisation),
 * Tab 2 every tracked work with spend + physical completion,
 * Tab 3 post-completion quality ratings (60% citizens · 40% inspection).
 */
export function FundDialog({
  open,
  onOpenChange,
  fund,
  works,
  constituencyName,
}: FundDialogProps) {
  // Flow-bar geometry (percentages of RECEIVED)
  const sanctionedUnspent = Math.max(0, fund.totalSanctionedLakh - fund.spentLakh);
  const pctSpent = fund.receivedLakh > 0 ? (fund.spentLakh / fund.receivedLakh) * 100 : 0;
  const pctSanctionedUnspent =
    fund.receivedLakh > 0 ? (sanctionedUnspent / fund.receivedLakh) * 100 : 0;
  const pctUncommitted =
    fund.receivedLakh > 0 ? (fund.uncommittedLakh / fund.receivedLakh) * 100 : 0;

  // Complaint-linked sanctioned by category (the slice this dashboard tracks)
  const byCategory = new Map<string, number>();
  for (const w of works) {
    byCategory.set(w.category, (byCategory.get(w.category) ?? 0) + w.amountLakh);
  }
  const maxCat = Math.max(1, ...byCategory.values());
  const trackedCompleted = works.filter((w) => w.status === 'Completed').length;
  const ratedWorks = works.filter((w) => w.quality);
  const avgTrackedProgress = works.length
    ? Math.round(works.reduce((s, w) => s + (w.progressPct ?? 0), 0) / works.length)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-3xl overflow-hidden border-[#374151] p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-[#374151] bg-[#1F2937] px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#374151] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-300">
              {constituencyName}
            </span>
            <span className="text-xs font-medium text-gray-400">
              MPLADS — fund utilisation &amp; work-quality ledger
            </span>
            {fund.qualityAlertsCount > 0 && (
              <span className="rounded-full bg-red-950/70 px-2 py-0.5 text-[10px] font-bold text-red-400 ring-1 ring-red-800">
                ⚠ {fund.qualityAlertsCount} quality{' '}
                {fund.qualityAlertsCount === 1 ? 'alert' : 'alerts'}
              </span>
            )}
          </div>
          <DialogTitle className="text-lg font-bold leading-snug text-white">
            Every rupee received, every work, every rating — one ledger
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-400">
            ₹{fund.receivedLakh / 100 > 1 ? `${(fund.receivedLakh / 100).toFixed(2)} Cr` : `${fund.receivedLakh}L`}{' '}
            received from the Government of India · {fund.allWorksCount} works ·{' '}
            {fund.allCompletedCount} completed · {fund.utilizationPct}% utilised
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="flow" className="flex min-h-0 flex-col">
          <div className="border-b border-[#374151] bg-[#1F2937] px-4 pt-2">
            <TabsList className="h-9 bg-[#111827]">
              <TabsTrigger
                value="flow"
                className="h-7 px-3 text-xs font-semibold data-[state=active]:bg-[#374151] data-[state=active]:text-white"
              >
                💰 Fund flow
              </TabsTrigger>
              <TabsTrigger
                value="works"
                className="h-7 px-3 text-xs font-semibold data-[state=active]:bg-[#374151] data-[state=active]:text-white"
              >
                🚧 Works &amp; completion
              </TabsTrigger>
              <TabsTrigger
                value="quality"
                className="h-7 px-3 text-xs font-semibold data-[state=active]:bg-[#374151] data-[state=active]:text-white"
              >
                ⭐ Quality ratings
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="max-h-[64vh] bg-[#111827]">
            {/* ── Tab 1 — Fund flow ─────────────────────────────────────── */}
            <TabsContent value="flow" className="space-y-4 p-4 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Money in */}
                <section
                  aria-label="Funds received from the government"
                  className="rounded-xl border border-[#374151] bg-[#1F2937] p-4"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Received from Government of India
                  </h3>
                  <p className="mt-1 text-3xl font-extrabold text-white">
                    {formatLakh(fund.receivedLakh)}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {fund.tranches.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-baseline justify-between gap-2 rounded-lg bg-[#111827]/60 px-2.5 py-1.5 text-xs"
                      >
                        <span className="min-w-0">
                          <span className="font-semibold text-gray-200">{t.label}</span>
                          <span className="ml-1.5 text-gray-500">
                            released {shortDate(t.date)}
                          </span>
                        </span>
                        <span className="shrink-0 font-bold text-emerald-400">
                          {formatLakh(t.amountLakh)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-gray-500">
                    ₹5 Cr/year entitlement per MP, released by MoSPI in two ₹2.5 Cr
                    tranches per financial year. Tranche 2 of FY 2026-27 is due
                    December 2026.
                  </p>
                </section>

                {/* Money out */}
                <section
                  aria-label="Where the money went"
                  className="rounded-xl border border-[#374151] bg-[#1F2937] p-4"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Where the money went
                  </h3>
                  <div
                    className="mt-3 flex h-6 w-full overflow-hidden rounded-md ring-1 ring-[#374151]"
                    role="img"
                    aria-label={`Spent ${formatLakh(fund.spentLakh)}, sanctioned but unspent ${formatLakh(sanctionedUnspent)}, uncommitted ${formatLakh(fund.uncommittedLakh)}`}
                  >
                    <div
                      className="flex items-center justify-center bg-emerald-600 text-[9px] font-bold text-white"
                      style={{ width: `${pctSpent}%` }}
                    >
                      {pctSpent >= 18 && `${Math.round(pctSpent)}%`}
                    </div>
                    <div
                      className="flex items-center justify-center bg-amber-600 text-[9px] font-bold text-white"
                      style={{ width: `${pctSanctionedUnspent}%` }}
                    >
                      {pctSanctionedUnspent >= 18 && `${Math.round(pctSanctionedUnspent)}%`}
                    </div>
                    <div
                      className="flex items-center justify-center bg-[#4B5563] text-[9px] font-bold text-gray-300"
                      style={{ width: `${pctUncommitted}%` }}
                    >
                      {pctUncommitted >= 18 && `${Math.round(pctUncommitted)}%`}
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs">
                    <li className="flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                        Spent — utilisation certificates received
                      </span>
                      <b className="text-white">{formatLakh(fund.spentLakh)}</b>
                    </li>
                    <li className="flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <span className="h-2.5 w-2.5 rounded-sm bg-amber-600" />
                        Sanctioned, not yet spent
                      </span>
                      <b className="text-white">{formatLakh(sanctionedUnspent)}</b>
                    </li>
                    <li className="flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#4B5563]" />
                        Uncommitted balance
                      </span>
                      <b className="text-white">{formatLakh(fund.uncommittedLakh)}</b>
                    </li>
                  </ul>
                  <p className="mt-2.5 rounded-lg bg-amber-950/25 px-2.5 py-2 text-[11px] leading-relaxed text-amber-300 ring-1 ring-amber-900/70">
                    Of the {formatLakh(fund.totalSanctionedLakh)} sanctioned,{' '}
                    <b>{formatLakh(fund.sanctionedLakh)}</b> sits on the{' '}
                    {fund.totalWorksCount} works this dashboard tracks in detail —
                    the slice tied to citizen complaints.
                  </p>
                </section>
              </div>

              {/* Category split of the tracked works */}
              <section
                aria-label="Sanctioned amount by department category, tracked works"
                className="rounded-xl border border-[#374151] bg-[#1F2937] p-4"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Complaint-linked sanctioned, by category
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[...byCategory.entries()].map(([cat, lakh]) => (
                    <div key={cat} className="flex items-center gap-2 text-xs">
                      <span className="w-20 shrink-0 truncate font-semibold text-gray-300">
                        {cat}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#111827]">
                        <div
                          className="h-full rounded-full bg-amber-600"
                          style={{ width: `${(lakh / maxCat) * 100}%` }}
                        />
                      </div>
                      <span className="w-14 shrink-0 text-right font-bold text-white">
                        ₹{lakh}L
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>

            {/* ── Tab 2 — Works & completion ────────────────────────────── */}
            <TabsContent value="works" className="space-y-4 p-4 pt-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-1.5 text-xs text-gray-400">
                  Tracked works completed{' '}
                  <b className="text-white">
                    {trackedCompleted}/{fund.totalWorksCount}
                  </b>
                </span>
                <span className="rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-1.5 text-xs text-gray-400">
                  Avg physical progress <b className="text-white">{avgTrackedProgress}%</b>
                </span>
                <span className="rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-1.5 text-xs text-gray-400">
                  Delayed works{' '}
                  <b className={fund.delayedWorksCount > 0 ? 'text-orange-400' : 'text-white'}>
                    {fund.delayedWorksCount}
                  </b>
                </span>
                <span className="rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-1.5 text-xs text-gray-400">
                  All constituency works{' '}
                  <b className="text-white">
                    {fund.allCompletedCount}/{fund.allWorksCount} done
                  </b>
                </span>
              </div>

              <ul className="space-y-2.5">
                {works.map((w) => {
                  const spent = w.spentLakh ?? 0;
                  const spentPct =
                    w.amountLakh > 0 ? Math.min(100, (spent / w.amountLakh) * 100) : 0;
                  const progress = w.progressPct ?? (w.status === 'Completed' ? 100 : 0);
                  return (
                    <li
                      key={w.id}
                      className="rounded-xl border border-[#374151] bg-[#1F2937] p-3.5"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="min-w-0 text-sm font-bold text-white">{w.workName}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[w.status]}`}
                        >
                          {MPLADS_STATUS_LABEL[w.status]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {w.ward} · {w.category} · {w.implementingAgency}
                        {w.completionDate && ` · completed ${shortDate(w.completionDate)}`}
                      </p>

                      <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* financial progress */}
                        <div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="text-gray-500">Funds drawn</span>
                            <span className="font-semibold text-gray-300">
                              ₹{spent}L of ₹{w.amountLakh}L
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#111827]">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${spentPct}%` }}
                            />
                          </div>
                        </div>
                        {/* physical progress */}
                        <div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="text-gray-500">Work on the ground</span>
                            <span className="font-semibold text-gray-300">{progress}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#111827]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: STATUS_BAR_HEX[w.status],
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {w.status === 'Delayed' && (
                        <p className="mt-2 text-[11px] font-medium text-orange-400">
                          → Delayed against the sanctioned schedule — the issue stays
                          open and keeps its rank.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Other works — aggregate */}
              <section
                aria-label="Other MPLADS works without open complaints"
                className="rounded-xl border border-dashed border-[#374151] bg-[#1F2937]/60 p-3.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-bold text-gray-300">
                    {fund.otherWorks.worksCount} other MPLADS works — no open
                    complaints
                  </p>
                  <p className="text-xs text-gray-400">
                    {fund.otherWorks.completedCount} completed ·{' '}
                    {formatLakh(fund.otherWorks.sanctionedLakh)} sanctioned ·{' '}
                    {formatLakh(fund.otherWorks.spentLakh)} spent
                    {fund.otherWorks.avgQuality !== null &&
                      ` · ⭐ ${fund.otherWorks.avgQuality.toFixed(1)}/5 avg`}
                  </p>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                  Tracked in aggregate — e.g. {fund.otherWorks.examples.join(', ')}.
                  If citizens report an issue on any of them, it opens a tracked
                  card and joins the ranked queue.
                </p>
              </section>
            </TabsContent>

            {/* ── Tab 3 — Quality ratings ───────────────────────────────── */}
            <TabsContent value="quality" className="space-y-4 p-4 pt-4">
              <section
                aria-label="How work quality is rated"
                className="rounded-xl border border-[#374151] bg-[#1F2937] p-4 text-[11px] leading-relaxed text-gray-400"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  How completed work is rated
                </h3>
                <p className="mt-1.5">
                  <b className="text-gray-200">Citizens (60%)</b> — phone-verified
                  complainants and nearby residents rate the work 1–5 by SMS after
                  the recorded completion. One rating per citizen: brigading can
                  no more inflate this than it can the ranking.
                </p>
                <p className="mt-1">
                  <b className="text-gray-200">Inspection (40%)</b> — third-party
                  engineer audit (mandatory for works above ₹10L), scored 1–5.
                </p>
                <p className="mt-1">
                  <b className="text-gray-200">Composite = 0.6 × citizens + 0.4 × inspection.</b>{' '}
                  Bands: ≥ 4.0 Good · 3.0–3.9 Satisfactory · &lt; 3.0 Poor →{' '}
                  <span className="font-semibold text-red-400">quality alert</span>:
                  corrective notice, re-inspection, and the linked issue is never
                  counted as resolved.
                </p>
              </section>

              <ul className="space-y-2.5">
                {ratedWorks.map((w) => {
                  const q = w.quality!;
                  const hex = QUALITY_HEX[q.band];
                  return (
                    <li
                      key={w.id}
                      className="rounded-xl border border-[#374151] bg-[#1F2937] p-3.5"
                      style={q.band === 'Poor' ? { boxShadow: `inset 0 0 0 1.5px ${hex}55` } : undefined}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="min-w-0 text-sm font-bold text-white">{w.workName}</p>
                        <BandBadge band={q.band} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        Completed {w.completionDate ? shortDate(w.completionDate) : '—'} ·{' '}
                        ₹{w.amountLakh}L · {w.implementingAgency}
                      </p>

                      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="rounded-lg bg-[#111827]/60 p-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                            Citizens ({q.citizenResponses} rated)
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5">
                            <Stars rating={q.citizenRating} />
                            <span className="text-xs font-bold text-white">
                              {q.citizenRating.toFixed(1)}
                            </span>
                          </p>
                        </div>
                        <div className="rounded-lg bg-[#111827]/60 p-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                            Inspection
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5">
                            <Stars rating={q.inspectionScore} tone="sky" />
                            <span className="text-xs font-bold text-white">
                              {q.inspectionScore.toFixed(1)}
                            </span>
                          </p>
                        </div>
                        <div className="rounded-lg bg-[#111827]/60 p-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                            Composite (60/40)
                          </p>
                          <p className="mt-0.5 text-lg font-extrabold leading-none" style={{ color: hex }}>
                            {q.composite.toFixed(1)}
                            <span className="text-xs font-bold text-gray-500">/5</span>
                          </p>
                        </div>
                      </div>

                      {q.band === 'Poor' ? (
                        <p
                          className="mt-2.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold leading-relaxed"
                          style={{ backgroundColor: '#DC262615', color: '#F87171' }}
                        >
                          ⚠ QUALITY ALERT — composite below 3.0. Corrective notice
                          issued and re-inspection ordered. The poor citizen rating{' '}
                          <b>corroborates the ground-truth dispute flag</b> on the
                          linked issue: complaints about this work kept arriving
                          after the recorded completion. Two independent signals,
                          one conclusion — this work is not actually done.
                        </p>
                      ) : (
                        <p className="mt-2.5 rounded-lg bg-emerald-950/25 px-2.5 py-2 text-[11px] font-semibold leading-relaxed text-emerald-400 ring-1 ring-emerald-900/70">
                          ✓ Verified clean — citizens rate the delivered work well
                          and zero complaints have arrived since the recorded
                          completion.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              <p className="rounded-lg border border-[#374151] bg-[#1F2937]/60 px-3 py-2 text-[11px] text-gray-500">
                Rated tracked works:{' '}
                <b className="text-gray-300">{ratedWorks.length}</b>
                {fund.avgQuality !== null && (
                  <>
                    {' '}
                    · average composite{' '}
                    <b
                      className={
                        fund.qualityAlertsCount > 0 ? 'text-red-400' : 'text-emerald-400'
                      }
                    >
                      {fund.avgQuality.toFixed(1)}/5
                    </b>
                  </>
                )}
                {fund.otherWorks.avgQuality !== null && (
                  <>
                    {' '}
                    · other (non-complaint) completions average{' '}
                    <b className="text-gray-300">
                      {fund.otherWorks.avgQuality.toFixed(1)}/5
                    </b>{' '}
                    across {fund.otherWorks.completedCount} works
                  </>
                )}
              </p>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="border-t border-[#374151] bg-[#1F2937] px-5 py-2.5">
          <p className="text-[10px] leading-tight text-gray-500">
            MPLADS framing: the MP recommends works; the district authority
            implements &amp; disburses. Source in production: mplads.gov.in
            sanctions + utilisation certificates, crossed with citizen ground
            reports.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
