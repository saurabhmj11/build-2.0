import { Category, MpladsStatus, Urgency, URGENCY_LABEL } from './types';

/**
 * DESIGN.md — urgency-coded color system (NOT category-coded):
 *  5 #DC2626 · 4 #EA580C · 3 #D97706 · 2 #65A30D · 1 #6B7280
 * Background #111827, card #1F2937, border #374151, disputed rose #B91C4A.
 */
export const URGENCY_HEX: Record<number, string> = {
  1: '#6B7280',
  2: '#65A30D',
  3: '#D97706',
  4: '#EA580C',
  5: '#DC2626',
};

/** Deep rose — distinct from every urgency red (Module 4b disputed signal). */
export const DISPUTED_HEX = '#B91C4A';
/** Amber for MPLADS sanction strips ("separate fact", dashed border). */
export const SANCTION_HEX = '#D97706';

/** Module 6 — quality band colors: Good emerald · Satisfactory amber · Poor red. */
export const QUALITY_HEX = {
  Good: '#10B981',
  Satisfactory: '#D97706',
  Poor: '#DC2626',
} as const;

export const QUALITY_BAND_STYLE = {
  Good: 'bg-emerald-950/40 text-emerald-400 ring-1 ring-emerald-800',
  Satisfactory: 'bg-amber-950/40 text-amber-400 ring-1 ring-amber-800',
  Poor: 'bg-red-950/40 text-red-400 ring-1 ring-red-800',
} as const;

/** 1–5 rating rendered as filled/hollow stars + numeric value. */
export function stars(rating: number): { filled: number; label: string } {
  return {
    filled: Math.round(rating),
    label: `${rating.toFixed(1)}/5`,
  };
}

/** Muted dark category chips — categories are labels, never priority signals. */
export const CATEGORY_STYLE: Record<Category, string> = {
  Roads: 'bg-stone-800 text-stone-300 border-stone-600',
  Water: 'bg-teal-950 text-teal-300 border-teal-800',
  Drainage: 'bg-cyan-950 text-cyan-300 border-cyan-800',
  Sanitation: 'bg-lime-950 text-lime-300 border-lime-800',
  Electricity: 'bg-amber-950 text-amber-300 border-amber-800',
  Health: 'bg-red-950 text-red-300 border-red-800',
  Education: 'bg-orange-950 text-orange-300 border-orange-800',
  Parks: 'bg-green-950 text-green-300 border-green-800',
  Safety: 'bg-rose-950 text-rose-300 border-rose-800',
  Pollution: 'bg-zinc-800 text-zinc-300 border-zinc-600',
  Other: 'bg-slate-800 text-slate-300 border-slate-600',
};

export function urgencyStyle(u: Urgency | number): { label: string; hex: string } {
  const clamped = Math.min(5, Math.max(1, u));
  return {
    label: URGENCY_LABEL[clamped as Urgency] ?? 'Medium',
    hex: URGENCY_HEX[clamped],
  };
}

export const MPLADS_STATUS_LABEL: Record<MpladsStatus, string> = {
  Delayed: 'DELAYED',
  Ongoing: 'ONGOING',
  Completed: 'COMPLETED',
  'Sanctioned – not started': 'NOT STARTED',
};

/** DESIGN.md: emoji markers, no custom icon assets. */
export const SOURCE_EMOJI: Record<string, string> = {
  WhatsApp: '💬',
  Phone: '📞',
  Letter: '✉️',
  'Walk-in': '🚶',
  App: '📱',
  'Voice note': '🎙️',
};

/** Mask a mock phone identity for the feed: PH-98201-7711 → •••• 7711 */
export function maskSubmitterId(submitterId: string): string {
  const m = submitterId.match(/^PH-[\d]+-(\d{4})$/);
  if (m) return `•••• ${m[1]}`;
  if (submitterId.startsWith('citizen:')) return '🆔 new';
  return submitterId.length > 6 ? `${submitterId.slice(0, 4)}…` : submitterId;
}

/** Priority score can be fractional after occupation weighting (e.g. 22.4). */
export function formatPriority(p: number): string {
  return Number.isInteger(p) ? String(p) : p.toFixed(1);
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatLakh(lakh: number): string {
  if (lakh >= 100) {
    return `₹${(lakh / 100).toFixed(2)} Cr`;
  }
  return `₹${lakh.toFixed(lakh % 1 === 0 ? 0 : 1)}L`;
}

/** Short date for sanction/completion strips: "14 Feb 2026" */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
