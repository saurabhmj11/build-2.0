'use client';

import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FundSummary } from '@/lib/types';
import { formatLakh } from '@/lib/client-format';

interface FundStripProps {
  fund: FundSummary;
  onOpenLedger: () => void;
}

/**
 * DESIGN.md — a thin context strip above the ranked cards, now carrying the
 * Module 6 fund-flow snapshot: received → sanctioned → spent → balance,
 * plus the work-quality alert count. Full ledger lives in the FundDialog.
 */
export function FundStrip({ fund, onOpenLedger }: FundStripProps) {
  return (
    <section
      aria-label="MPLADS fund utilisation and work quality summary"
      className="rounded-lg border border-[#374151] bg-[#1F2937] px-3.5 py-2"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
        <span className="font-semibold text-gray-300">MPLADS ledger</span>
        <span className="text-gray-600">|</span>
        <span className="font-semibold text-gray-300">Received from Govt</span>
        <span className="text-white">{formatLakh(fund.receivedLakh)}</span>
        <span className="text-gray-600">·</span>
        <span className="font-semibold text-gray-300">Sanctioned</span>
        <span className="text-white">{formatLakh(fund.totalSanctionedLakh)}</span>
        <span className="text-gray-600">·</span>
        <span className="font-semibold text-gray-300">Spent</span>
        <span className="text-white">
          {formatLakh(fund.spentLakh)}{' '}
          <span className="text-[10px] text-gray-500">
            ({fund.utilizationPct}% utilised)
          </span>
        </span>
        <span className="text-gray-600">·</span>
        <span className="font-semibold text-gray-300">Balance</span>
        <span className="text-white">{formatLakh(fund.balanceLakh)}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenLedger}
          aria-label="Open the full MPLADS fund utilisation and work quality ledger"
          className="ml-auto h-6 gap-1 border-[#4B5563] bg-transparent px-2 text-[11px] font-bold text-gray-300 hover:bg-[#374151] hover:text-white"
        >
          <Wallet className="h-3 w-3" aria-hidden />
          Full ledger
        </Button>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[#374151]/60 pt-1.5 text-[11px] text-gray-500">
        <span>
          Works completed{' '}
          <b className="text-gray-300">
            {fund.allCompletedCount}/{fund.allWorksCount}
          </b>
        </span>
        <span className="text-gray-600">|</span>
        <span>
          <b className="text-amber-400">
            {formatLakh(fund.tiedToOpenComplaintsLakh)}
          </b>{' '}
          tied to still-open complaints
        </span>
        {fund.avgQuality !== null && (
          <>
            <span className="text-gray-600">|</span>
            <span>
              Rated completions{' '}
              <b
                className={
                  fund.qualityAlertsCount > 0 ? 'text-red-400' : 'text-emerald-400'
                }
              >
                ⭐ {fund.avgQuality.toFixed(1)}/5
              </b>{' '}
              average
            </span>
          </>
        )}
        {fund.qualityAlertsCount > 0 && (
          <span
            className="rounded-full bg-red-950/60 px-2 py-0.5 font-bold text-red-400 ring-1 ring-red-800"
            title="Completed works rated below 3.0/5 — corrective action + linked issues kept open"
          >
            ⚠ {fund.qualityAlertsCount} quality{' '}
            {fund.qualityAlertsCount === 1 ? 'alert' : 'alerts'}
          </span>
        )}
        <span className="ml-auto text-[10px] text-gray-600">
          MPs recommend works; district agencies implement &amp; disburse
        </span>
      </div>
    </section>
  );
}
