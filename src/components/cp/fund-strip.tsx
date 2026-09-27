'use client';

import { FundSummary } from '@/lib/types';
import { formatLakh } from '@/lib/client-format';

interface FundStripProps {
  fund: FundSummary;
}

/**
 * DESIGN.md — a thin ONE-LINE context strip above the ranked cards.
 * The "tied to still-open complaints" number is the accountability punchline.
 */
export function FundStrip({ fund }: FundStripProps) {
  return (
    <section
      aria-label="MPLADS fund accountability summary"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-[#374151] bg-[#1F2937] px-3.5 py-2 text-xs text-gray-400"
    >
      <span className="font-semibold text-gray-300">MPLADS Entitlement</span>
      <span className="text-white">{formatLakh(fund.entitlementLakh)}/yr</span>
      <span className="text-gray-600">|</span>
      <span className="font-semibold text-gray-300">Sanctioned so far</span>
      <span className="text-white">
        {formatLakh(fund.sanctionedLakh)}
        <span className="ml-1 text-[10px] text-gray-500">
          ({fund.totalWorksCount} works · {fund.delayedWorksCount} delayed)
        </span>
      </span>
      <span className="text-gray-600">|</span>
      <span className="font-semibold text-gray-300">Tied to still-open complaints</span>
      <span className="font-bold text-amber-400" title="Sanctioned money sitting on issues the ground says are not fixed">
        {formatLakh(fund.tiedToOpenComplaintsLakh)}
      </span>
      <span className="ml-auto text-[10px] text-gray-600">
        MPs recommend works; district agencies implement &amp; disburse
      </span>
    </section>
  );
}
