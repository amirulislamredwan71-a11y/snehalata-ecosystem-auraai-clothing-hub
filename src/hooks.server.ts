import { redirect, type Handle } from '@sveltejs/kit';

// The Aura Control Center lives ONLY at admin.snehalata.com. Any /admin request on the
// main domain (snehalata.com / www.snehalata.com) is 308-redirected to the subdomain.
// The subdomain itself reaches the /admin page via the reroute in hooks.ts — its document
// request is host=admin.snehalata.com, pathname '/', so it's never caught here (no loop).
// localhost / *.vercel.app keep working so dev + preview can still open /admin.
export const handle: Handle = async ({ event, resolve }) => {
  const host = event.url.hostname.toLowerCase();
  const path = event.url.pathname;
  if (
    (path === '/admin' || path.startsWith('/admin/')) &&
    host.endsWith('snehalata.com') &&
    host !== 'admin.snehalata.com'
  ) {
    throw redirect(308, 'https://admin.snehalata.com/');
  }
  return resolve(event);
};
