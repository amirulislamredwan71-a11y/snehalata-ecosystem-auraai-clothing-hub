import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';

export const POST = async ({ request }) => {
  try {
    const { prompt } = await request.json();
    const data = await gemini.analyzeSearchIntent(prompt);
    return json(data);
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
