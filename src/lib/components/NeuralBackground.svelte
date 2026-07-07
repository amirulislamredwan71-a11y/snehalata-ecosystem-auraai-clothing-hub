<script lang="ts">
  // Lightweight, CSS-only ambient background — the Aura Neural Grid identity.
  // Deliberately NO mousemove listener and NO per-frame reactivity: the previous
  // version updated $state on every mouse move and re-rendered 50+ particles each
  // time, jamming the main thread (site-wide jank / "menus dead until refresh").
  // Everything here is pure CSS @keyframes → GPU-cheap, zero main-thread cost.
  const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
    left: (i * 8.3 + 4) % 100,
    top: (i * 137.5) % 100, // golden-angle scatter, deterministic (SSR-safe)
    size: 2 + (i % 3),
    dur: 9 + (i % 6),
    delay: (i * 0.7) % 5,
    color: ['#10b981', '#34d399', '#c79a3e', '#059669'][i % 4]
  }));
</script>

<div class="fixed inset-0 -z-10 overflow-hidden bg-[#0a0f0d]" aria-hidden="true">
  <!-- faint drifting neural grid lines -->
  <div class="nb-grid absolute inset-0 neural-grid opacity-70"></div>
  <!-- emerald aurora glow (top) + gold glow (mid-left) -->
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_-8%,rgba(16,185,129,0.16),transparent_55%)]"></div>
  <div class="nb-glow nb-glow-green absolute -top-24 -right-24 w-[52vmin] h-[52vmin] rounded-full"></div>
  <div class="nb-glow nb-glow-gold absolute top-1/3 -left-24 w-[44vmin] h-[44vmin] rounded-full"></div>
  <!-- pulsing node particles -->
  <div class="absolute inset-0 opacity-50">
    {#each PARTICLES as p}
      <span
        class="nb-particle absolute rounded-full"
        style="left:{p.left}%; top:{p.top}%; width:{p.size}px; height:{p.size}px; background:{p.color}; animation-duration:{p.dur}s; animation-delay:{p.delay}s;"
      ></span>
    {/each}
  </div>
  <!-- concentric neural rings -->
  <div class="nb-ring absolute top-1/2 left-1/2 w-[60vmin] h-[60vmin]"></div>
  <div class="nb-ring nb-ring-2 absolute top-1/2 left-1/2 w-[40vmin] h-[40vmin]"></div>
</div>

<style>
  .nb-grid {
    animation: nb-drift 24s linear infinite;
    will-change: transform;
  }
  @keyframes nb-drift {
    from { transform: translate(0, 0); }
    to { transform: translate(26px, 26px); }
  }
  .nb-glow {
    filter: blur(8px);
    animation: nb-glowpulse 6.5s ease-in-out infinite;
  }
  .nb-glow-green { background: radial-gradient(circle, rgba(16, 185, 129, 0.30), transparent 70%); }
  .nb-glow-gold { background: radial-gradient(circle, rgba(199, 154, 62, 0.18), transparent 70%); animation-delay: 1.2s; }
  @keyframes nb-glowpulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.85; } }
  .nb-particle {
    will-change: transform, opacity;
    animation-name: nb-float;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }
  @keyframes nb-float {
    0%, 100% { transform: translateY(0); opacity: 0.25; }
    50% { transform: translateY(-22px); opacity: 0.6; }
  }
  .nb-ring {
    transform: translate(-50%, -50%);
    border: 1px solid rgba(16, 185, 129, 0.08);
    border-radius: 50%;
    animation: nb-pulse 7s ease-in-out infinite;
  }
  .nb-ring-2 {
    border-color: rgba(199, 154, 62, 0.06);
    animation-duration: 9s;
    animation-direction: reverse;
  }
  @keyframes nb-pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.8; }
  }
  @media (prefers-reduced-motion: reduce) {
    .nb-particle, .nb-ring, .nb-grid, .nb-glow { animation: none; }
  }
</style>
