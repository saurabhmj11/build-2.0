'use client';

import {
  ArrowRight,
  CheckCircle2,
  Database,
  Languages,
  Mic,
  Quote,
  Waypoints,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InfraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEMO_STACK: { Icon: typeof Mic; title: string; detail: string }[] = [
  {
    Icon: Waypoints,
    title: 'LLM API — the whole intelligence layer',
    detail:
      'One call classifies + translates + scores urgency + matches duplicates; one mega-prompt generates the report. 3 call types total, nothing else.',
  },
  {
    Icon: Mic,
    title: 'Web Speech API — browser-native voice input',
    detail:
      'Real mic transcription in Chrome/Edge with zero extra services. A stopgap that proves the voice-complaint UX works today.',
  },
  {
    Icon: Database,
    title: 'Self-contained SVG ward map + sample MPLADS data',
    detail:
      'No tile server, no external calls — the hotspot map is hand-built inline SVG over the seeded records.',
  },
];

const PRODUCTION_STACK: { title: string; license: string; detail: string }[] = [
  {
    title: 'AI4Bharat IndicConformer-600M',
    license: 'MIT',
    detail:
      'Real ASR for all 22 scheduled Indian languages — replaces the Web Speech API stopgap (needs a Python inference server).',
  },
  {
    title: 'AI4Bharat IndicTrans2',
    license: 'Apache 2.0',
    detail:
      'Purpose-built Indic machine translation — replaces LLM-API translation at scale, far cheaper per complaint.',
  },
  {
    title: 'Bhashini',
    license: 'Govt of India API layer',
    detail:
      'Aggregates AI4Bharat / CDAC / IIIT-H models behind one government-endorsed API — the language infra an MP office already trusts.',
  },
  {
    title: 'sentence-transformers',
    license: 'Apache 2.0',
    detail:
      'Multilingual embeddings + cosine-similarity clustering — takes over duplicate detection when volume outgrows an LLM context window.',
  },
  {
    title: 'mplads.gov.in + dataful.in',
    license: 'Public data',
    detail:
      'Official MPLADS portal + ready-to-query structured datasets replace the sample fund records with real, public data.',
  },
];

export function InfraDialog({ open, onOpenChange }: InfraDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Languages className="h-4 w-4 text-emerald-700" aria-hidden />
            Open infrastructure — demo today, production tomorrow
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-slate-500">
            What runs live in this demo vs. the open-source / public-data stack it
            graduates to. Nothing in the production roadmap is proprietary.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="grid gap-5 px-5 py-4 sm:grid-cols-2">
            <section aria-label="Live in this demo">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Live in this demo
              </h3>
              <ul className="space-y-3">
                {DEMO_STACK.map((s) => (
                  <li key={s.title} className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                    <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
                      <s.Icon className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
                      {s.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.detail}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="Production roadmap">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                Production roadmap — open-source &amp; public data
              </h3>
              <ul className="space-y-3">
                {PRODUCTION_STACK.map((s) => (
                  <li key={s.title} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-slate-800">
                      {s.title}
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                        {s.license}
                      </span>
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.detail}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mx-5 mb-5 rounded-lg border-l-4 border-emerald-600 bg-emerald-50/60 p-3.5">
            <p className="flex items-start gap-2 text-[13px] font-medium leading-relaxed text-emerald-900">
              <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              &ldquo;The demo runs on an LLM API plus browser-native voice input to
              prove the UX in two hours; production swaps in AI4Bharat&apos;s
              open-source Indic models and the same MPLADS data already public on
              mplads.gov.in — nothing here depends on proprietary or closed
              infrastructure.&rdquo;
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
