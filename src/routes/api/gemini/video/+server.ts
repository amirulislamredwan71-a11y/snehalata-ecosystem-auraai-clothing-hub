import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';

export const POST = async ({ request }) => {
  try {
    const { prompt, aspectRatio } = await request.json();
    const uri = await gemini.generateAuraVideo(prompt, aspectRatio);
    return json({ url: uri });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
