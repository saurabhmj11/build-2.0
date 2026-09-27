/**
 * Maharashtra two-constituency pilot (ARCHITECTURE.md):
 * Nagpur + Mumbai North are LIVE (full seed datasets); the rest of
 * Maharashtra's 48 Lok Sabha seats are shown as "demo data" stubs —
 * the platform, not the deployment, is the product.
 */

export type ConstituencyKind = 'live' | 'demo';

export interface Constituency {
  id: string; // slug — store key & URL param
  name: string; // Lok Sabha constituency
  city: string;
  state: string;
  mpName?: string;
  party?: string;
  kind: ConstituencyKind;
  /** one-line complaint-texture description (Nagpur vs Mumbai extremes) */
  blurb: string;
}

export const CONSTITUENCIES: Constituency[] = [
  {
    id: 'nagpur',
    name: 'Nagpur',
    city: 'Nagpur',
    state: 'Maharashtra',
    mpName: 'Nitin Gadkari',
    party: 'BJP',
    kind: 'live',
    blurb: 'Vidarbha, semi-urban · roads, borewells, PHC gaps, agri-market access',
  },
  {
    id: 'mumbai-north',
    name: 'Mumbai North',
    city: 'Mumbai (Borivali–Dahisar–Malad–Kandivali)',
    state: 'Maharashtra',
    mpName: 'Piyush Goyal',
    party: 'BJP',
    kind: 'live',
    blurb: 'Dense metro · waterlogging, garbage, air quality, high civic overload',
  },
  {
    id: 'pune',
    name: 'Pune',
    city: 'Pune',
    state: 'Maharashtra',
    kind: 'demo',
    blurb: 'IT-city traffic, encroachment, lake restoration',
  },
  {
    id: 'thane',
    name: 'Thane',
    city: 'Thane',
    state: 'Maharashtra',
    kind: 'demo',
    blurb: 'Metro-adjacent flooding, hill-road landslides',
  },
  {
    id: 'nashik',
    name: 'Nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    kind: 'demo',
    blurb: 'Grape-belt agri infra, Godavari riverfront works',
  },
  {
    id: 'aurangabad',
    name: 'Aurangabad',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    kind: 'demo',
    blurb: 'Heritage-city drainage, tourism-zone sanitation',
  },
  {
    id: 'amravati',
    name: 'Amravati',
    city: 'Amravati',
    state: 'Maharashtra',
    kind: 'demo',
    blurb: 'Cotton-belt market roads, PHC staffing',
  },
  {
    id: 'kolhapur',
    name: 'Kolhapur',
    city: 'Kolhapur',
    state: 'Maharashtra',
    kind: 'demo',
    blurb: 'Panchganga flood-control works, sugar-belt infra',
  },
  {
    id: 'solapur',
    name: 'Solapur',
    city: 'Solapur',
    state: 'Maharashtra',
    kind: 'demo',
    blurb: 'Textile-hub water scarcity, beedi-zone health camps',
  },
  {
    id: 'kalyan',
    name: 'Kalyan',
    city: 'Kalyan–Dombivli',
    state: 'Maharashtra',
    kind: 'demo',
    blurb: 'Rail-corridor congestion, slum sanitation',
  },
];

export const LIVE_CONSTITUENCIES = CONSTITUENCIES.filter((c) => c.kind === 'live');

export const LIVE_CONSTITUENCY_IDS = LIVE_CONSTITUENCIES.map((c) => c.id);

export function isLiveConstituency(id: string | null | undefined): boolean {
  return Boolean(id && LIVE_CONSTITUENCY_IDS.includes(id));
}

export function findConstituency(id: string | null | undefined): Constituency | undefined {
  return CONSTITUENCIES.find((c) => c.id === id);
}

/** Metadata embedded in every dashboard state payload. */
export interface ConstituencyMeta {
  id: string;
  name: string;
  city: string;
  state: string;
  mpName: string;
  party: string;
}

export function constituencyMeta(id: string): ConstituencyMeta {
  const c = findConstituency(id);
  return {
    id: c?.id ?? id,
    name: c?.name ?? id,
    city: c?.city ?? '',
    state: c?.state ?? 'Maharashtra',
    mpName: c?.mpName ?? '—',
    party: c?.party ?? '—',
  };
}
