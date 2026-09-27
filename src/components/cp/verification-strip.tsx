'use client';

import { VerificationSummary } from '@/lib/types';

interface VerificationStripProps {
  summary: VerificationSummary;
}

/** Module 4 — slim two-sided verification status bar (dark). */
export function VerificationStrip({ summary }: VerificationStripProps) {
  return (
    <section
      aria-label="Two-sided verification layer status"
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-[#374151] bg-[#1F2937] px-3.5 py-2 text-xs text-gray-400"
    >
      <span className="flex items-center gap-1.5 text-[13px] font-bold text-white">
        🛡️ Two-sided verification
      </span>
      <span>{summary.issuesChecked} issues checked</span>
      <span className="font-semibold text-emerald-400">
        {summary.verifiedGenuine} verified genuine
      </span>
      {summary.coordinationFlagged > 0 && (
        <span className="font-semibold text-amber-400">
          📋 {summary.coordinationFlagged} campaign{summary.coordinationFlagged === 1 ? '' : 's'}{' '}
          quarantined
        </span>
      )}
      {summary.duplicateDeWeighted > 0 && (
        <span className="font-semibold text-amber-400">
          {summary.duplicateDeWeighted} de-weighted for repeat submitters
        </span>
      )}
      {summary.disputedCompletions > 0 && (
        <span className="font-semibold text-rose-400">
          🚩 {summary.disputedCompletions} disputed official completion
          {summary.disputedCompletions === 1 ? '' : 's'}
        </span>
      )}
      {summary.farmerWeighted > 0 && (
        <span className="font-semibold text-lime-400">
          🌾 {summary.farmerWeighted} farmer-weighted{' '}
          {summary.farmerWeighted === 1 ? 'issue' : 'issues'}
        </span>
      )}
      <span className="ml-auto text-[10px] text-gray-600">
        Priority = distinct citizens × urgency × occupation weight — phone-OTP
        intake, one citizen one vote
      </span>
    </section>
  );
}
