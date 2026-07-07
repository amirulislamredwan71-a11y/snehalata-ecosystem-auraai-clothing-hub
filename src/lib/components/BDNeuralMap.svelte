<script lang="ts">
  // Stylised Bangladesh map with the Aura Neural Grid lit up across every division —
  // the brand's "AI reaches every point of BD" visual. Pure SVG + CSS animation.
  const DHAKA = { x: 105, y: 132 };
  const NODES = [
    { x: 105, y: 132, r: 4, gold: true },   // Dhaka (hub)
    { x: 150, y: 176, r: 3 },                // Chattogram
    { x: 143, y: 224, r: 2.6 },              // Cox's Bazar
    { x: 150, y: 92, r: 3 },                 // Sylhet
    { x: 108, y: 82, r: 2.6 },               // Mymensingh
    { x: 74, y: 60, r: 2.8 },                // Rangpur
    { x: 58, y: 120, r: 2.8 },               // Rajshahi
    { x: 72, y: 188, r: 2.8 },               // Khulna
    { x: 100, y: 196, r: 2.6 }               // Barishal
  ];
  const OUTLINE = 'M70,40 L150,58 L166,82 L160,112 L150,150 L156,182 L150,214 L143,240 L131,216 L121,196 L106,206 L86,201 L70,206 L59,190 L54,164 L46,120 L51,94 L60,60 Z';
</script>

<div class="bd-map relative w-full h-full flex items-center justify-center">
  <svg viewBox="0 0 210 270" class="w-full h-full max-h-full" fill="none" aria-label="Aura Neural Grid across Bangladesh">
    <!-- faint grid backdrop -->
    <defs>
      <radialGradient id="bdglow" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="rgba(16,185,129,0.18)" />
        <stop offset="100%" stop-color="rgba(16,185,129,0)" />
      </radialGradient>
    </defs>
    <circle cx="105" cy="130" r="105" fill="url(#bdglow)" />

    <!-- country outline -->
    <path d={OUTLINE} fill="rgba(16,185,129,0.06)" stroke="rgba(16,185,129,0.55)" stroke-width="1.4" stroke-linejoin="round" />

    <!-- neural connections from the Dhaka hub -->
    {#each NODES.slice(1) as n, i}
      <line class="bd-line" x1={DHAKA.x} y1={DHAKA.y} x2={n.x} y2={n.y}
        stroke="rgba(16,185,129,0.35)" stroke-width="0.8" style="animation-delay:{i * 0.25}s" />
    {/each}

    <!-- nodes -->
    {#each NODES as n, i}
      <circle class="bd-halo" cx={n.x} cy={n.y} r={n.r + 3}
        fill={n.gold ? 'rgba(199,154,62,0.30)' : 'rgba(16,185,129,0.28)'} style="animation-delay:{i * 0.3}s" />
      <circle cx={n.x} cy={n.y} r={n.r} fill={n.gold ? '#c79a3e' : '#10b981'} />
    {/each}
  </svg>
</div>

<style>
  .bd-line {
    stroke-dasharray: 3 4;
    animation: bd-dash 2.4s linear infinite;
  }
  @keyframes bd-dash { to { stroke-dashoffset: -14; } }
  .bd-halo {
    transform-box: fill-box;
    transform-origin: center;
    animation: bd-pulse 3.2s ease-in-out infinite;
  }
  @keyframes bd-pulse {
    0%, 100% { opacity: 0.4; transform: scale(0.85); }
    50% { opacity: 1; transform: scale(1.25); }
  }
  @media (prefers-reduced-motion: reduce) {
    .bd-line, .bd-halo { animation: none; }
  }
</style>
