'use client';

import {
  Copy,
  FileWarning,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { VerificationSummary } from '@/lib/types';

interface VerificationStripProps {
  summary: VerificationSummary;
}

/** Module 4 — slim two-sided verification status bar. */
export function VerificationStrip({ summary }: VerificationStripProps) {
  return (
    <section
      aria-label="Two-sided verification layer status"
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-sm"
    >
      <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
        <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden />
        Two-sided verification
      </span>
      <span className="text-slate-500">
        {summary.issuesChecked} issues checked
      </span>
      <span className="font-semibold text-emerald-700">
        {summary.verifiedGenuine} verified genuine
      </span>
      {summary.coordinationFlagged > 0 && (
        <span className="flex items-center gap-1 font-semibold text-amber-700">
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {summary.coordinationFlagged} possible coordinated input
        </span>
      )}
      {summary.duplicateDeWeighted > 0 && (
        <span className="font-semibold text-amber-700">
          {summary.duplicateDeWeighted} de-weighted for repeat submitters
        </span>
      )}
      {summary.disputedCompletions > 0 && (
        <span className="flex items-center gap-1 font-semibold text-red-700">
          <FileWarning className="h-3.5 w-3.5" aria-hidden />
          {summary.disputedCompletions} disputed official completion
        </span>
      )}
      <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
        <Phone className="h-3 w-3" aria-hidden />
        Intake hardening (design req): phone OTP + per-number rate limits — one
        citizen, one vote
      </span>
    </section>
  );
}
