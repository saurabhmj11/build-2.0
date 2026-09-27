'use client';

import { WardStat } from '@/lib/types';

interface WardMapProps {
  stats: WardStat[];
  selected: string | null;
  onSelect: (ward: string | null) => void;
}

const CELL_W = 88;
const CELL_H = 62;
const GAP = 10;
const COLS = 4;

/** Dark-mode density scale (quiet → 1–2 → 3–5 → 6+). */
function densityStyle(count: number): { fill: string; text: string; sub: string } {
  if (count <= 0) return { fill: '#1F2937', text: '#6B7280', sub: '#4B5563' };
  if (count <= 2) return { fill: '#1A2E05', text: '#BEF264', sub: '#65A30D' };
  if (count <= 5) return { fill: '#451A03', text: '#FCD34D', sub: '#D97706' };
  return { fill: '#450A0A', text: '#FCA5A5', sub: '#DC2626' };
}

/**
 * Inline SVG ward hotspot grid — hand-built, no tile server (open-infrastructure
 * constraint). Wards are derived from the data (complaints + MPLADS works),
 * so each constituency renders its own map.
 */
export function WardMap({ stats, selected, onSelect }: WardMapProps) {
  const wards = stats.map((s) => s.ward);
  const byWard = new Map(stats.map((s) => [s.ward, s]));
  const rows = Math.max(1, Math.ceil(wards.length / COLS));
  const width = COLS * CELL_W + (COLS - 1) * GAP;
  const height = rows * CELL_H + (rows - 1) * GAP;

  return (
    <section
      aria-label="Ward complaint hotspot map"
      className="rounded-xl border border-[#374151] bg-[#1F2937] p-4"
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">🗺️ Ward hotspots</h2>
        <p className="text-[11px] text-gray-500">
          complaint density · <span className="font-semibold text-amber-500">₹</span> =
          MPLADS work on record · click a ward to filter
        </p>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full max-h-60"
        role="group"
        aria-label="Map of constituency wards colored by complaint density"
      >
        {wards.map((ward, i) => {
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
                stroke={isSelected ? '#D97706' : '#374151'}
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
                  fill="#D97706"
                  aria-label="MPLADS work on record"
                >
                  ₹
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1F2937] ring-1 ring-[#374151]" />
          quiet
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-lime-950 ring-1 ring-lime-700" />
          1–2
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-950 ring-1 ring-amber-700" />
          3–5
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-950 ring-1 ring-red-800" />
          6+
        </span>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="ml-auto rounded-full bg-amber-950/60 px-2.5 py-0.5 font-bold text-amber-400 ring-1 ring-amber-800 transition-colors hover:bg-amber-900/60"
          >
            {selected} — clear ✕
          </button>
        )}
      </div>
    </section>
  );
}
