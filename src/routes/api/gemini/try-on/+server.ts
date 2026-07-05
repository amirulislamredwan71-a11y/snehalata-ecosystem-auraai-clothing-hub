import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';
import { tryOnModelsLab, modelslabConfigured, clothTypeFor, NoCreditsError } from '$lib/server/modelslab.server';

// Try-on (upload + generation + polling) can take a while — give the function room.
export const config = { maxDuration: 60 };

export const POST = async ({ request }) => {
  const { userImg, productImg, category } = await request.json();
  let mlNoCredits = false;

  // 1) ModelsLab dedicated garment try-on (primary — cheapest ~$0.002/img)
  if (modelslabConfigured()) {
    try {
      const out = await tryOnModelsLab({
        personImage: userImg,
        garmentImage: productImg,
        clothType: clothTypeFor(category)
      });
      if (out) return json({ image: out }); // out is a public URL
    } catch (e: any) {
      mlNoCredits = e instanceof NoCreditsError;
      if (!mlNoCredits) console.error('[try-on] ModelsLab failed:', e?.message);
    }
  }

  // 2) Gemini image fallback (works only if Gemini billing is enabled)
  try {
    const data = await gemini.generateTryOnTransformation(userImg, productImg);
    if (data) return json({ image: `data:image/png;base64,${data}` });
  } catch (e: any) {
    const m = String(e?.message || '');
    const gemQuota = /RESOURCE_EXHAUSTED|429|quota|limit:\s*0|billing/i.test(m);
    if (mlNoCredits || gemQuota) {
      return json({
        error: 'setup',
        message:
          'Aura Try-On is ready — just add a little ModelsLab wallet credit (or enable Gemini billing) and it activates instantly. আপাতত AI ইমেজ কোটা শেষ, একটু পরে আবার চেষ্টা করুন।'
      });
    }
    return json({ error: 'busy', message: 'Aura Vision is very busy right now — please try again in a few seconds.' });
  }

  // Gemini returned no image without throwing
  if (mlNoCredits) {
    return json({
      error: 'setup',
      message:
        'Aura Try-On is ready — just add a little ModelsLab wallet credit (or enable Gemini billing) and it activates instantly.'
    });
  }
  return json({ error: 'busy', message: 'Aura could not read the photos clearly — please try clearer images.' });
};
