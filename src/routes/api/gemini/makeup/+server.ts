import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';

// Cosmetics try-on (selfie + shade → recoloured lips/cheeks/eyes). Single-image edit, so
// it's the reliable Gemini path. maxDuration for the image generation.
export const config = { maxDuration: 60 };

export const POST = async ({ request }: { request: Request }) => {
  const { selfie, shade, kind } = await request.json();
  if (!selfie || !shade) {
    return json({ error: 'input', message: 'সেলফি ও একটি শেড — দুটোই দরকার।' });
  }
  try {
    const data = await gemini.generateMakeupTryOn(selfie, String(shade), String(kind || 'lipstick'));
    if (data) return json({ image: `data:image/png;base64,${data}` });
  } catch (e: any) {
    const m = String(e?.message || '');
    if (/RESOURCE_EXHAUSTED|429|quota|limit:\s*0|billing/i.test(m)) {
      return json({ error: 'busy', message: 'Aura Vision এখন খুব ব্যস্ত (AI image quota) — একটু পরে আবার চেষ্টা করুন।' });
    }
    console.error('[makeup] endpoint error:', m);
  }
  return json({
    error: 'busy',
    message: 'Aura সেলফিটা পরিষ্কারভাবে পড়তে পারেনি — মুখ স্পষ্ট দেখা যায় এমন একটা সেলফি দিন।'
  });
};
