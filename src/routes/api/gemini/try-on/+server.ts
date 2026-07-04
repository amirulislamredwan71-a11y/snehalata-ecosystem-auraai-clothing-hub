import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';

// Image generation + 503-retries can take a while — give the function room.
export const config = { maxDuration: 60 };

export const POST = async ({ request }) => {
  try {
    const { userImg, productImg } = await request.json();
    const data = await gemini.generateTryOnTransformation(userImg, productImg);
    if (!data) return json({ error: 'busy', message: 'Aura could not read the photos clearly — please try clearer images.' });
    return json({ image: data });
  } catch (error: any) {
    const m = String(error?.message || '');
    // 429 / RESOURCE_EXHAUSTED with limit:0 = the Gemini key has no image-generation quota (free tier).
    if (/RESOURCE_EXHAUSTED|429|quota|limit:\s*0|billing/i.test(m)) {
      return json({ error: 'quota', message: 'AI Try-On (Aura Vision) needs Gemini image billing enabled on the API key — the free tier allows 0 image generations. Once billing is on, Try-On works instantly.' });
    }
    return json({ error: 'busy', message: 'Aura Vision is very busy right now — please try again in a few seconds.' });
  }
};
