// ModelsLab virtual try-on (dedicated garment fashion endpoint). Cheap image try-on
// (~$0.002/img) — the primary Try-On engine when MODELSLAB_API_KEY + wallet credit exist.
// If the wallet is out of credits it throws NoCreditsError so the caller can fall back
// to Gemini (billing) or show an honest "activate" message.
import { env } from '$env/dynamic/private';
import { adminClient } from '$lib/server/vendorSync';

const KEY = env.MODELSLAB_API_KEY;
const FASHION_URL = 'https://modelslab.com/api/v6/image_editing/fashion';
const FETCH_URL = 'https://modelslab.com/api/v6/image_editing/fetch';
const SITE = 'https://www.snehalata.com';

export function modelslabConfigured(): boolean {
  return !!KEY;
}

export class NoCreditsError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'NoCreditsError';
  }
}

/** Map a product category to ModelsLab's cloth_type enum. */
export function clothTypeFor(category?: string): 'upper_body' | 'lower_body' | 'dresses' {
  const c = (category || '').toLowerCase();
  if (/saree|shari|dress|three|3-?piece|gown|frock|kameez/.test(c)) return 'dresses';
  if (/pant|trouser|jean|palazzo|skirt|lower/.test(c)) return 'lower_body';
  return 'upper_body';
}

/**
 * Turn any image reference into a PUBLIC URL that ModelsLab can fetch.
 * - http(s) URL → returned as-is
 * - "/path" (relative) → prefixed with the site origin
 * - data:image/...;base64 → uploaded to the public `tryon` Supabase bucket
 */
export async function toPublicUrl(image: string, prefix = 'img'): Promise<string> {
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('/')) return SITE + image;
  const m = image.match(/^data:(image\/[\w+.-]+);base64,(.+)$/s);
  if (!m) throw new Error('Unsupported image reference for try-on');
  const mime = m[1];
  const ext = (mime.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '');
  const bytes = Buffer.from(m[2], 'base64');
  const a = adminClient();
  const path = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9).toString(36)}.${ext}`;
  const { error } = await a.storage.from('tryon').upload(path, bytes, { contentType: mime, upsert: false });
  if (error) throw new Error('try-on upload failed: ' + error.message);
  return a.storage.from('tryon').getPublicUrl(path).data.publicUrl;
}

async function pollResult(id: string | number, tries = 9): Promise<string | null> {
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const resp = await fetch(`${FETCH_URL}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: KEY })
      });
      const data = await resp.json();
      if (data.status === 'success' && Array.isArray(data.output) && data.output.length) return data.output[0];
      if (data.status === 'error') return null;
    } catch {
      /* keep polling */
    }
  }
  return null;
}

/** Run a garment try-on. Returns a public image URL. Throws NoCreditsError when the wallet is empty. */
export async function tryOnModelsLab(opts: {
  personImage: string;
  garmentImage: string;
  clothType?: 'upper_body' | 'lower_body' | 'dresses';
}): Promise<string | null> {
  if (!KEY) throw new Error('ModelsLab not configured');
  const [initUrl, clothUrl] = await Promise.all([
    toPublicUrl(opts.personImage, 'user'),
    toPublicUrl(opts.garmentImage, 'cloth')
  ]);
  const resp = await fetch(FASHION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: KEY,
      init_image: initUrl,
      cloth_image: clothUrl,
      cloth_type: opts.clothType || 'upper_body',
      prompt:
        'A realistic photo of the same person naturally wearing this exact garment — correct fit, natural drape, lighting and shadows, unchanged face and pose.',
      negative_prompt: 'low quality, unrealistic, warped cloth, distorted body, extra limbs, blurry',
      base64: 'false',
      guidance_scale: '8',
      num_inference_steps: '21'
    })
  });
  const data = await resp.json();
  const msg = String(data?.message || '');
  if (/credit|wallet|subscribe|fund/i.test(msg)) throw new NoCreditsError(msg);
  if (data.status === 'success' && Array.isArray(data.output) && data.output.length) return data.output[0];
  if (data.status === 'processing' && data.id) return await pollResult(data.id);
  throw new Error(msg || 'ModelsLab try-on failed');
}
