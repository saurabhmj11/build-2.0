'use client';

import { Radio, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ConstituencyMeta } from '@/lib/constituencies';

interface HeaderProps {
  constituency: ConstituencyMeta;
  onSwitchConstituency: () => void;
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
  constituency,
  onSwitchConstituency,
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
    <header className="sticky top-0 z-40 border-b border-[#374151] bg-[#111827]/95 backdrop-blur supports-[backdrop-filter]:bg-[#111827]/85">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onSwitchConstituency}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-lg font-black text-white shadow-sm transition-colors hover:bg-amber-500"
            aria-label="Back to constituency search"
            title="Back to constituency search"
          >
            CP
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className="truncate text-base font-bold leading-tight text-white">
                {constituency.name}
              </h1>
              <span className="rounded-full bg-[#374151] px-2 py-0.5 text-[10px] font-semibold text-gray-300">
                {constituency.mpName} · {constituency.party}
              </span>
            </div>
            <p className="truncate text-[11px] text-gray-500">
              CitizenPulse · {constituency.city}, {constituency.state} ·{' '}
              {totalComplaints} complaints → {totalIssues} issues · {aiCount} AI-classified live
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onSwitchConstituency}
            className="hidden rounded-full border border-[#374151] bg-[#1F2937] px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-amber-700 hover:text-amber-400 sm:block"
          >
            ← Constituencies
          </button>

          <div className="flex items-center gap-2 rounded-full border border-[#374151] bg-[#1F2937] px-3 py-1.5">
            <Radio
              className={`h-4 w-4 ${liveOn ? 'animate-pulse text-red-500' : 'text-gray-500'}`}
              aria-hidden
            />
            <label
              htmlFor="live-sim"
              className="cursor-pointer select-none text-xs font-medium text-gray-300"
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
            className="gap-1.5 bg-amber-600 font-semibold text-white hover:bg-amber-500"
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
                  className="h-9 w-9 border-[#374151] bg-[#1F2937] text-gray-400 hover:bg-[#374151] hover:text-white"
                >
                  🛰️
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
                  className="h-9 w-9 border-[#374151] bg-[#1F2937] text-gray-400 hover:bg-[#374151] hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Reset this constituency&apos;s demo</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
