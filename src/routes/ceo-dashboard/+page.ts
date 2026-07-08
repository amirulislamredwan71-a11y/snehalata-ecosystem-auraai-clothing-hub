import { redirect } from '@sveltejs/kit';

// The control center moved to /admin (Aura Control Center). Keep the old path working.
export const load = () => {
  throw redirect(307, '/admin');
};
