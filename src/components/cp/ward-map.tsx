'use client';

import { MapPinned } from 'lucide-react';
import { WardStat } from '@/lib/types';

interface WardMapProps {
  stats: WardStat[];
  selected: string | null;
  onSelect: (ward: string | null) => void;
}

/** All 12 constituency wards — fixed 4×3 grid (hand-built inline SVG,
 *  no tile server, per ARCHITECTURE.md open-infrastructure constraints). */
const ALL_WARDS = Array.from({ length: 12 }, (_, i) => `Ward ${i + 1}`);

const CELL_W = 88;
const CELL_H = 62;
const GAP = 10;
const COLS = 4;

function densityStyle(count: number): { fill: string; text: string; sub: string } {
  if (count <= 0) return { fill: '#f1f5f9', text: '#94a3b8', sub: '#cbd5e1' };
  if (count <= 2) return { fill: '#a7f3d0', text: '#065f46', sub: '#047857' };
  if (count <= 5) return { fill: '#fcd34d', text: '#78350f', sub: '#92400e' };
  return { fill: '#f87171', text: '#7f1d1d', sub: '#991b1b' };
}

export function WardMap({ stats, selected, onSelect }: WardMapProps) {
  const byWard = new Map(stats.map((s) => [s.ward, s]));
  const rows = Math.ceil(ALL_WARDS.length / COLS);
  const width = COLS * CELL_W + (COLS - 1) * GAP;
  const height = rows * CELL_H + (rows - 1) * GAP;

  return (
    <section
      aria-label="Ward complaint hotspot map"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <MapPinned className="h-4 w-4 text-slate-500" aria-hidden />
          Ward hotspots
        </h2>
        <p className="text-[11px] text-slate-400">
          complaint density · <span className="font-semibold text-slate-500">₹</span> = MPLADS
          work on record · click a ward to filter
        </p>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full max-h-60"
        role="group"
        aria-label="Map of constituency wards colored by complaint density"
      >
        {ALL_WARDS.map((ward, i) => {
          const stat = byWard.get(ward);
          const count = stat?.complaintCount ?? 0;
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = col * (CELL_W + GAP);
          const y = row * (CELL_H + GAP);
          const d = densityStyle(count);
          const isSelected = selected === ward;
          const hasMplads = stat?.hasMplads ?? false;
          const num = ward.replace('Ward ', '');
          const tooltip = [
            ward,
            `${count} ${count === 1 ? 'complaint' : 'complaints'}`,
            stat?.topIssue ? `top issue: ${stat.topIssue}` : null,
            hasMplads ? 'MPLADS work on record' : null,
            isSelected ? 'click to clear filter' : 'click to filter issues',
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <g
              key={ward}
              role="button"
              tabIndex={0}
              aria-label={tooltip}
              onClick={() => onSelect(isSelected ? null : ward)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(isSelected ? null : ward);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <title>{tooltip}</title>
              <rect
                x={x}
                y={y}
                width={CELL_W}
                height={CELL_H}
                rx={10}
                fill={d.fill}
                stroke={isSelected ? '#047857' : '#e2e8f0'}
                strokeWidth={isSelected ? 3 : 1}
              />
              <text
                x={x + 9}
                y={y + 18}
                fontSize={10}
                fontWeight={700}
                fill={d.sub}
              >
                W{num}
              </text>
              <text
                x={x + CELL_W / 2}
                y={y + 40}
                fontSize={20}
                fontWeight={800}
                textAnchor="middle"
                fill={d.text}
                aria-hidden
              >
                {count}
              </text>
              <text
                x={x + CELL_W / 2}
                y={y + 52}
                fontSize={7.5}
                textAnchor="middle"
                fill={d.sub}
                aria-hidden
              >
                {count === 1 ? 'complaint' : 'complaints'}
              </text>
              {hasMplads && (
                <text
                  x={x + CELL_W - 10}
                  y={y + 18}
                  fontSize={11}
                  fontWeight={800}
                  textAnchor="end"
                  fill={d.sub}
                  aria-label="MPLADS work on record"
                >
                  ₹
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-100 ring-1 ring-slate-200" />
          quiet
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-200" />
          1–2
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-300" />
          3–5
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" />
          6+
        </span>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
          >
            {selected} — clear ✕
          </button>
        )}
      </div>
    </section>
  );
}
