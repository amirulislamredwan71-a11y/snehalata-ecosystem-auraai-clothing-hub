// Professional, non-sequential order tracking code.
//
// The DB `orders.id` is a small sequential integer (ORD-5) — weak: guessable + looks
// unprofessional. This encodes the id **reversibly** into a code like `SNH-250707-1A2B3C`
// so it's self-contained (no extra DB column needed) yet still resolves back to the id.
//
// Scramble = 32-bit multiplicative hash (Knuth's constant, bijective over uint32) via
// Math.imul (exact 32-bit modular multiply — plain * would lose precision above 2^53).

const K = 2654435761; // 0x9E3779B1 — odd → invertible mod 2^32
const OFFSET = 7000019;

// Modular inverse of K mod 2^32 via Newton's iteration (a·x ≡ 1). 5 steps → full 32 bits.
function inv32(a: number): number {
  let x = 1;
  for (let i = 0; i < 5; i++) x = Math.imul(x, 2 - Math.imul(a, x));
  return x >>> 0;
}
const KINV = inv32(K);

export function encodeTracking(id: number, date: Date = new Date()): string {
  const scrambled = Math.imul((id + OFFSET) | 0, K) >>> 0;
  const code = scrambled.toString(36).toUpperCase().padStart(7, '0');
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `SNH-${yy}${mm}${dd}-${code}`;
}

// Accepts the new `SNH-YYMMDD-CODE`, a plain number, or the legacy `ORD-<n>` — returns the
// numeric order id (or null if unparseable). Backward compatible with old tracking links.
export function decodeTracking(input: string): number | null {
  const s = String(input || '').trim().toUpperCase();
  const plain = s.replace(/^ORD-/, '');
  if (/^\d+$/.test(plain)) return Number(plain);
  const m = s.match(/^SNH-\d{6}-([0-9A-Z]+)$/);
  if (!m) return null;
  const scrambled = parseInt(m[1], 36);
  if (!Number.isFinite(scrambled)) return null;
  const id = (Math.imul(scrambled >>> 0, KINV) >>> 0) - OFFSET;
  return id > 0 ? id : null;
}
