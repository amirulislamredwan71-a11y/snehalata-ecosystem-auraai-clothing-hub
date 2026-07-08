import type { Reroute } from '@sveltejs/kit';

// Vendor subdomains: <shop>.snehalata.com → render that vendor's storefront (/store/<shop>)
// without changing the visible URL. Runs on both server + client (universal hook).
const ROOT = 'snehalata.com';
const RESERVED = new Set([
  'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'store',
  'cdn', 'assets', 'static', 'vercel', 'aura', 'dashboard'
]);

export const reroute: Reroute = ({ url }) => {
  const host = url.hostname.toLowerCase();
  if (!host.endsWith('.' + ROOT)) return; // apex / www / preview / localhost → normal routing
  const sub = host.slice(0, -(ROOT.length + 1));
  // Aura Control Center gateway: admin.snehalata.com/ → /admin (deeper paths route normally).
  if (sub === 'admin') return url.pathname === '/' ? '/admin' : undefined;
  if (!sub || sub.includes('.') || RESERVED.has(sub)) return;
  // Only the shop root maps to the storefront; deeper paths (cart, product, etc.) route normally.
  if (url.pathname === '/') return `/store/${sub}`;
};
