// Neural Grid A1 — lightweight client-side event capture.
// Fire-and-forget: batches events and flushes to /api/events. NEVER throws and
// never blocks the UI — analytics must not be able to break the shopping flow.
import { browser } from '$app/environment';

export type AuraEventType = 'view' | 'search' | 'add_to_cart' | 'try_on';

interface TrackData {
  product_id?: number | null;
  vendor_id?: number | null;
  meta?: Record<string, unknown>;
}

const SESSION_KEY = 'aura_session_id';
const FLUSH_MS = 2500;
const MAX_BATCH = 10;

let queue: Array<TrackData & { event_type: AuraEventType; session_id: string }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const seenViews = new Set<string>(); // dedupe product views per session → counts reflect reach, not re-opens

function sessionId(): string {
  if (!browser) return 'ssr';
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

/** Send whatever is queued right now. Safe to call anytime. */
export function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!browser || queue.length === 0) return;
  const batch = queue;
  queue = [];
  const body = JSON.stringify({ events: batch });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    /* swallow — analytics must never surface an error */
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_MS);
}

/** Record an interaction. No-op on the server. */
export function track(event_type: AuraEventType, data: TrackData = {}): void {
  if (!browser) return;

  // Dedupe repeated views of the same product within a session.
  if (event_type === 'view' && data.product_id != null) {
    const k = `${sessionId()}:${data.product_id}`;
    if (seenViews.has(k)) return;
    seenViews.add(k);
  }

  queue.push({
    event_type,
    product_id: data.product_id ?? null,
    vendor_id: data.vendor_id ?? null,
    meta: data.meta ?? {},
    session_id: sessionId()
  });

  if (queue.length >= MAX_BATCH) flush();
  else scheduleFlush();
}

// Don't lose queued events on navigation / tab close.
if (browser) {
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}
