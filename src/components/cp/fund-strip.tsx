'use client';

import { AlertTriangle, IndianRupee, Layers, Landmark } from 'lucide-react';
import { FundSummary } from '@/lib/types';
import { formatLakh } from '@/lib/client-format';

interface FundStripProps {
  fund: FundSummary;
  totalComplaints: number;
  totalIssues: number;
}

export function FundStrip({ fund, totalComplaints, totalIssues }: FundStripProps) {
  const cards = [
    {
      label: 'MPLADS entitlement',
      value: formatLakh(fund.entitlementLakh),
      sub: 'per MP · per year',
      Icon: Landmark,
      iconCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'Sanctioned works on record',
      value: formatLakh(fund.sanctionedLakh),
      sub: `${fund.totalWorksCount} works recommended`,
      Icon: IndianRupee,
      iconCls: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      label: 'Tied to still-open complaints',
      value: formatLakh(fund.tiedToOpenComplaintsLakh),
      sub: `${fund.matchedWorksCount} matched works · ${fund.delayedWorksCount} delayed`,
      Icon: AlertTriangle,
      iconCls: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      label: 'Signal extracted',
      value: `${totalIssues} issues`,
      sub: `${totalComplaints} complaints de-duplicated`,
      Icon: Layers,
      iconCls: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  return (
    <section aria-label="MPLADS fund accountability summary">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${c.iconCls}`}
            >
              <c.Icon className="h-4.5 w-4.5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-500">{c.label}</p>
              <p className="text-xl font-bold leading-tight text-slate-900">{c.value}</p>
              <p className="truncate text-[11px] text-slate-400">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 px-1 text-[11px] leading-relaxed text-slate-400">
        Accurate framing: MPs <span className="font-medium text-slate-500">recommend</span> works
        under MPLADS; funds are released by the government to the{' '}
        <span className="font-medium text-slate-500">district implementing agency</span>. Records
        verify what was sanctioned and its completion status — they do not track the MP&apos;s
        personal money.
      </p>
    </section>
  );
}
