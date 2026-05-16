import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';

export const POST = async ({ request }) => {
  try {
    const { message, history, inventory, vendors } = await request.json();
    const response = await gemini.generateAuraResponse(message, history || [], inventory, vendors);
    return json({ text: response });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
