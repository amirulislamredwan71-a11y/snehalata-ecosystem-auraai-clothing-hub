<script lang="ts">
  // Lightweight, CSS-only ambient background. Deliberately NO mousemove listener
  // and NO per-frame reactivity — the previous version updated $state on every
  // mouse move and re-rendered 50+ particles each time, jamming the main thread
  // (that was the site-wide jank / "menus dead until refresh" / high-INP cause).
  const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
    left: (i * 8.3 + 4) % 100,
    top: (i * 137.5) % 100, // golden-angle scatter, deterministic (SSR-safe)
    size: 2 + (i % 3),
    dur: 9 + (i % 6),
    delay: (i * 0.7) % 5,
    color: ['#7c3aed', '#a78bfa', '#c4b5fd', '#6d28d9'][i % 4]
  }));
</script>

<div class="fixed inset-0 -z-10 overflow-hidden bg-[#060507]" aria-hidden="true">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(124,58,237,0.10),transparent_60%)]"></div>
  <div class="absolute inset-0 opacity-40">
    {#each PARTICLES as p}
      <span
        class="nb-particle absolute rounded-full"
        style="left:{p.left}%; top:{p.top}%; width:{p.size}px; height:{p.size}px; background:{p.color}; animation-duration:{p.dur}s; animation-delay:{p.delay}s;"
      ></span>
    {/each}
  </div>
  <div class="nb-ring absolute top-1/2 left-1/2 w-[60vmin] h-[60vmin]"></div>
  <div class="nb-ring nb-ring-2 absolute top-1/2 left-1/2 w-[40vmin] h-[40vmin]"></div>
</div>

<style>
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
    border: 1px solid rgba(124, 58, 237, 0.08);
    border-radius: 50%;
    animation: nb-pulse 7s ease-in-out infinite;
  }
  .nb-ring-2 {
    border-color: rgba(124, 58, 237, 0.05);
    animation-duration: 9s;
    animation-direction: reverse;
  }
  @keyframes nb-pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.8; }
  }
  @media (prefers-reduced-motion: reduce) {
    .nb-particle, .nb-ring { animation: none; }
  }
</style>
