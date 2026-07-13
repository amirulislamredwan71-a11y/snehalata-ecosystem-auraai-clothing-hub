// Fire a Meta Pixel standard event (no-op until PUBLIC_META_PIXEL_ID is set, which loads fbq).
// Used across the funnel (AddToCart → InitiateCheckout → Purchase) so Meta ads can optimize
// for real conversions + build retargeting audiences.
export function metaTrack(event: string, data?: Record<string, unknown>) {
  try {
    (window as any).fbq?.('track', event, data || {});
  } catch {
    /* pixel not loaded / SSR */
  }
}
