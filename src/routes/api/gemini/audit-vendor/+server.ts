import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';

export const POST = async ({ request }) => {
  try {
    const { shopName, description, tradeLicense } = await request.json();
    const data = await gemini.auditVendorDescription(shopName, description, tradeLicense);
    return json(data);
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
