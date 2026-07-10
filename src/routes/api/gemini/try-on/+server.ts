import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';
import { tryOnModelsLab, modelslabConfigured, clothTypeFor, NoCreditsError } from '$lib/server/modelslab.server';

// Try-on (upload + generation + polling) can take a while — give the function room.
export const config = { maxDuration: 60 };

export const POST = async ({ request }) => {
  const { userImg, productImg, category } = await request.json();
  let gemQuota = false;

  // 1) Gemini image try-on (PRIMARY — billing is enabled; accepts URL or base64 now).
  try {
    const data = await gemini.generateTryOnTransformation(userImg, productImg);
    if (data) return json({ image: `data:image/png;base64,${data}` });
  } catch (e: any) {
    const m = String(e?.message || '');
    gemQuota = /RESOURCE_EXHAUSTED|429|quota|limit:\s*0|billing/i.test(m);
    if (!gemQuota) console.error('[try-on] Gemini failed:', m);
  }

  // 2) ModelsLab dedicated garment engine (SECONDARY — higher quality, needs wallet credit).
  if (modelslabConfigured()) {
    try {
      const out = await tryOnModelsLab({
        personImage: userImg,
        garmentImage: productImg,
        clothType: clothTypeFor(category)
      });
      if (out) return json({ image: out }); // out is a public URL
    } catch (e: any) {
      if (!(e instanceof NoCreditsError)) console.error('[try-on] ModelsLab failed:', e?.message);
    }
  }

  // Honest failure — no image was produced.
  if (gemQuota) {
    return json({
      error: 'busy',
      message: 'Aura Vision এখন খুব ব্যস্ত (AI image quota) — একটু পরে আবার চেষ্টা করুন।'
    });
  }
  return json({
    error: 'busy',
    message:
      'Aura ছবিটা পরিষ্কারভাবে পড়তে পারেনি — আপনার পুরো শরীরের একটা স্পষ্ট ছবি (ভালো আলোতে, সোজা হয়ে দাঁড়িয়ে) দিয়ে আবার চেষ্টা করুন।'
  });
};
