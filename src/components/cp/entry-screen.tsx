'use client';

import { useMemo, useState } from 'react';
import { Constituency, LIVE_CONSTITUENCY_IDS } from '@/lib/constituencies';

interface EntryScreenProps {
  constituencies: Constituency[];
  onSelect: (id: string) => void;
}

/**
 * DESIGN.md entry screen — a single centered search step, not a form.
 * Live pilot constituencies are clickable; the rest of Maharashtra shows as
 * "demo data" stubs (the 2 → 543 scaling story).
 */
export function EntryScreen({ constituencies, onSelect }: EntryScreenProps) {
  const [query, setQuery] = useState('');

  const { live, demo } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (c: Constituency) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      (c.mpName ?? '').toLowerCase().includes(q);

    const live = constituencies.filter((c) => c.kind === 'live' && match(c));
    const demo = constituencies.filter((c) => c.kind === 'demo' && match(c));
    return { live, demo };
  }, [constituencies, query]);

  return (
    <div className="flex min-h-screen flex-col bg-[#111827]">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-12">
        {/* Brand + subhead */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Citizen<span className="text-amber-500">Pulse</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-400">
            The closed-loop truth engine for MP offices — multilingual citizen
            complaints clustered and ranked, cross-checked against MPLADS fund
            records. What citizens report vs. what official records claim.
          </p>
        </div>

        {/* Search */}
        <label htmlFor="constituency-search" className="sr-only">
          Search your city or constituency
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg" aria-hidden>
            🔍
          </span>
          <input
            id="constituency-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your city or constituency — try “Nagpur” or “Mumbai”"
            autoComplete="off"
            className="w-full rounded-xl border border-[#374151] bg-[#1F2937] py-4 pl-12 pr-4 text-[15px] text-white placeholder:text-gray-500 shadow-lg focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/30"
          />
        </div>

        {/* Results */}
        <div className="mt-4 space-y-2" role="list" aria-label="Constituencies">
          {live.map((c) => (
            <button
              key={c.id}
              type="button"
              role="listitem"
              onClick={() => onSelect(c.id)}
              className="group flex w-full items-center gap-4 rounded-xl border border-[#374151] bg-[#1F2937] p-4 text-left transition-colors hover:border-amber-600 hover:bg-[#253141]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-bold text-white">{c.name}</span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-800">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Live pilot
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {c.mpName} · {c.party} · Lok Sabha, {c.state}
                </p>
                <p className="mt-1 truncate text-[11px] text-gray-500">{c.blurb}</p>
              </div>
              <span
                className="shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500"
                aria-hidden
              >
                →
              </span>
            </button>
          ))}

          {demo.length > 0 && (
            <p className="px-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
              Demo data — rolling out post-pilot
            </p>
          )}
          {demo.map((c) => (
            <div
              key={c.id}
              role="listitem"
              aria-label={`${c.name} — demo data, available post-pilot`}
              className="flex cursor-not-allowed items-center gap-4 rounded-xl border border-dashed border-[#374151]/70 bg-[#1F2937]/40 p-4 opacity-60"
              title="Demo stub — available in the full rollout"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-bold text-gray-300">{c.name}</span>
                  <span className="rounded-full bg-[#374151] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Demo data
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  Lok Sabha, {c.state}
                </p>
                <p className="mt-1 truncate text-[11px] text-gray-600">{c.blurb}</p>
              </div>
              <span className="shrink-0 text-gray-700" aria-hidden>
                🔒
              </span>
            </div>
          ))}

          {live.length === 0 && demo.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#374151] p-6 text-center text-sm text-gray-500">
              No match for “{query}” — try “Nagpur” or “Mumbai”.
            </p>
          )}
        </div>
      </main>

      <footer className="border-t border-[#374151]/60 px-4 py-4">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-1.5 text-center">
          <p className="text-[11px] leading-relaxed text-gray-500">
            Piloting Maharashtra — {LIVE_CONSTITUENCY_IDS.length} of 48 Lok Sabha
            constituencies live. Vidarbha&apos;s semi-urban Nagpur and metro Mumbai
            North are deliberately opposite profiles: the same pipeline handling
            both is the proof it scales to any of the 543 seats.
          </p>
          <p className="text-[11px] text-gray-600">
            Demo data is synthetic · Intake assumes phone-OTP verified citizens
            (one citizen, one vote)
          </p>
        </div>
      </footer>
    </div>
  );
}
