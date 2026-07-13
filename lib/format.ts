// Formatting + small domain helpers shared across the app.

export function money(n: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function money0(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export function daysFromNow(days: number): string {
  const d = new Date("2026-06-23T00:00:00Z");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function relativeAge(iso: string): string {
  const now = new Date("2026-06-23T12:00:00Z").getTime();
  const then = new Date(iso).getTime();
  const days = Math.round((now - then) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

// Deterministic pseudo-random in [0,1) seeded by a string — stable demo numbers.
export function seeded(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // xorshift
  h ^= h << 13;
  h ^= h >>> 17;
  h ^= h << 5;
  return ((h >>> 0) % 100000) / 100000;
}

export function pick<T>(arr: T[], seed: string): T {
  return arr[Math.floor(seeded(seed) * arr.length)];
}

// Deal-ID grammar: {PREFIX}{SEQ} // {Origin} - {Dest} {Year} {Make} {Model} {Class} SN-{serial}
export function buildDealId(opts: {
  prefix: string;
  seq: number;
  origin?: string;
  destination?: string;
  year: number;
  make: string;
  model: string;
  commodityClass: string;
  serial: string;
}): string {
  const lane = opts.origin && opts.destination ? `${opts.origin} - ${opts.destination} ` : "";
  return `${opts.prefix}${opts.seq} // ${lane}${opts.year} ${opts.make} ${opts.model} ${opts.commodityClass} SN-${opts.serial}`;
}

export const VESSELS = [
  "Solstice Voyager / 274S",
  "Maersk Nokwanda / 421W",
  "MSC Allegra / 118E",
  "Ever Given / 0312W",
  "COSCO Galaxy / 045E",
  "ONE Olympus / 089N",
  "Hapag Berlin Express / 233W",
];
