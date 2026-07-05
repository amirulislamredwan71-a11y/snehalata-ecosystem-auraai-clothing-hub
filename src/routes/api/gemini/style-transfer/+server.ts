import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';

// Image generation + 503-retries can take a while — give the function room.
export const config = { maxDuration: 60 };

export const POST = async ({ request }) => {
  try {
    const { image, style } = await request.json();
    const data = await gemini.generateStyleTransfer(image, style);
    if (!data) return json({ error: 'busy', message: 'Aura could not process that image — please try a clearer photo.' });
    return json({ image: `data:image/png;base64,${data}` });
  } catch (error: any) {
    const m = String(error?.message || '');
    if (/RESOURCE_EXHAUSTED|429|quota|limit:\s*0|billing/i.test(m)) {
      return json({ error: 'quota', message: 'Aura Vision image editing needs Gemini image billing enabled on the API key (free tier allows 0 image generations). Once billing is on, it works instantly.' });
    }
    return json({ error: 'busy', message: 'Aura Vision is very busy right now — please try again in a few seconds.' });
  }
};
