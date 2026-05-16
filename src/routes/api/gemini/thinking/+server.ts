import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';

export const POST = async ({ request }) => {
  try {
    const { prompt } = await request.json();
    const text = await gemini.complexThinkingAura(prompt);
    return json({ text });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
