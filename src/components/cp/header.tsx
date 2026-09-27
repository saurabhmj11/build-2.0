'use client';

import { Activity, Globe2, Radio, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderProps {
  liveOn: boolean;
  onToggleLive: (on: boolean) => void;
  onSubmitClick: () => void;
  onReset: () => void;
  onInfraClick: () => void;
  totalComplaints: number;
  totalIssues: number;
  aiCount: number;
}

export function Header({
  liveOn,
  onToggleLive,
  onSubmitClick,
  onReset,
  onInfraClick,
  totalComplaints,
  totalIssues,
  aiCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <Activity className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight text-slate-900">
              CitizenPulse
            </h1>
            <p className="truncate text-xs text-slate-500">
              Constituency intelligence console · MP office staff
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {totalComplaints} complaints → {totalIssues} issues
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {aiCount} AI-classified live
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
            <Radio
              className={`h-4 w-4 ${liveOn ? 'animate-pulse text-red-600' : 'text-slate-400'}`}
              aria-hidden
            />
            <label
              htmlFor="live-sim"
              className="cursor-pointer select-none text-xs font-medium text-slate-700"
            >
              Live feed sim
            </label>
            <Switch
              id="live-sim"
              checked={liveOn}
              onCheckedChange={onToggleLive}
              aria-label="Toggle live complaint feed simulation"
            />
          </div>

          <Button
            onClick={onSubmitClick}
            size="sm"
            className="gap-1.5 bg-emerald-700 font-semibold text-white hover:bg-emerald-800"
          >
            <Send className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Submit complaint</span>
            <span className="sm:hidden">Submit</span>
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onInfraClick}
                  size="icon"
                  variant="outline"
                  aria-label="Open infrastructure roadmap"
                  className="h-9 w-9 border-slate-300"
                >
                  <Globe2 className="h-4 w-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open infrastructure roadmap</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onReset}
                  size="icon"
                  variant="outline"
                  aria-label="Reset demo to seeded state"
                  className="h-9 w-9 border-slate-300"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Reset demo</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
