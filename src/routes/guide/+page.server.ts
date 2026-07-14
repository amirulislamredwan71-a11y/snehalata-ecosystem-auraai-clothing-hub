import type { PageServerLoad } from './$types';

// The guide is fully static content (hard-coded how-to steps + a YouTube embed), so hard
// edge-cache it: served from the CDN in ~ms instead of a cold serverless render on every
// hit (it was `max-age=0, must-revalidate` = no edge caching). 1-day s-maxage + 1-week SWR.
export const load: PageServerLoad = async ({ setHeaders }) => {
  setHeaders({ 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' });
  return {};
};
