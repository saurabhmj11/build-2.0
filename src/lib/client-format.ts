import {
  Ban,
  CheckCircle2,
  Clock3,
  FileText,
  Footprints,
  Mail,
  MessageCircle,
  Mic,
  Phone,
  Smartphone,
} from 'lucide-react';
import { Category, MpladsStatus, Urgency, URGENCY_LABEL } from './types';

/** Soft category chip colors (no indigo/blue). */
export const CATEGORY_STYLE: Record<Category, string> = {
  Roads: 'bg-stone-100 text-stone-700 border-stone-300',
  Water: 'bg-teal-50 text-teal-700 border-teal-300',
  Sanitation: 'bg-lime-50 text-lime-800 border-lime-300',
  Electricity: 'bg-amber-50 text-amber-700 border-amber-300',
  Health: 'bg-red-50 text-red-700 border-red-300',
  Education: 'bg-orange-50 text-orange-800 border-orange-300',
  Parks: 'bg-green-50 text-green-700 border-green-300',
  Safety: 'bg-rose-50 text-rose-700 border-rose-300',
  Other: 'bg-slate-100 text-slate-600 border-slate-300',
};

export function urgencyStyle(u: Urgency | number): { label: string; cls: string } {
  const label = URGENCY_LABEL[(Math.min(5, Math.max(1, u)) as Urgency)] ?? 'Medium';
  switch (u) {
    case 5:
      return { label, cls: 'bg-red-600 text-white' };
    case 4:
      return { label, cls: 'bg-orange-500 text-white' };
    case 3:
      return { label, cls: 'bg-amber-400 text-amber-950' };
    case 2:
      return { label, cls: 'bg-yellow-200 text-yellow-900' };
    default:
      return { label, cls: 'bg-slate-200 text-slate-700' };
  }
}

export const MPLADS_STATUS_STYLE: Record<MpladsStatus, { cls: string; Icon: typeof Clock3 }> = {
  Delayed: { cls: 'text-red-700 bg-red-50 border-red-200', Icon: Ban },
  Ongoing: { cls: 'text-amber-700 bg-amber-50 border-amber-200', Icon: Clock3 },
  Completed: { cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', Icon: CheckCircle2 },
  'Sanctioned – not started': { cls: 'text-slate-700 bg-slate-100 border-slate-300', Icon: FileText },
};

export const SOURCE_ICON: Record<string, typeof Phone> = {
  WhatsApp: MessageCircle,
  Phone: Phone,
  Letter: Mail,
  'Walk-in': Footprints,
  App: Smartphone,
  'Voice note': Mic,
};

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
