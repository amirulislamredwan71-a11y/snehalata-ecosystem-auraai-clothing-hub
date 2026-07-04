// Branded inline-SVG placeholder shown when a product image fails to load.
export const IMG_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="100%" height="100%" fill="#1b1410"/><text x="50%" y="50%" fill="#c79a3e" font-family="Georgia,serif" font-size="26" letter-spacing="3" text-anchor="middle" dominant-baseline="middle" opacity="0.55">SNEHALATA</text></svg>'
  );

// Smaller, faster, more reliable product image URL. Unsplash hotlinks without
// sizing params load the full-res original — dozens at once get throttled and
// fail intermittently (the "broken image" icons). Adding params fixes both.
export function productImg(url: string | undefined | null, w = 600): string {
  const u = (url || '').trim();
  if (!u) return IMG_FALLBACK;
  if (u.startsWith('data:')) return u;
  if (u.includes('images.unsplash.com') && !u.includes('?')) {
    return `${u}?w=${w}&q=75&auto=format&fit=crop`;
  }
  return u;
}

// <img onerror={imgFallback}> — swap to the placeholder once (no reload loops).
export function imgFallback(e: Event) {
  const img = e.currentTarget as HTMLImageElement;
  if (img.dataset.fb) return;
  img.dataset.fb = '1';
  img.src = IMG_FALLBACK;
}

// Read a File and return a downscaled JPEG data URL.
//
// Why: phone-camera photos are 8-15 MB. Base64-encoding one and POSTing it to a
// Vercel serverless function blows past the ~4.5 MB request-body limit, so the AI
// upload silently fails ON MOBILE ONLY (desktop test images are small). Downscaling
// to ~1280px + JPEG q0.82 keeps every upload well under the limit and speeds up the
// Gemini vision calls. Falls back to the raw data URL if canvas processing fails.
export async function fileToCompressedDataURL(
  file: File,
  maxDim = 1280,
  quality = 0.82
): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = rawDataUrl;
    });

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    if (!width || !height) return rawDataUrl;

    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawDataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return rawDataUrl;
  }
}
