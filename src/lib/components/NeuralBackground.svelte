<script lang="ts">
  let mouseX = $state(0);
  let mouseY = $state(0);
  let particles = $state<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);
  
  const COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd', '#6d28d9'];
  
  function initParticles() {
    particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.5 + 0.1,
    }));
  }
  
  function handleMouseMove(e: MouseEvent) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }
  
  $effect(() => {
    initParticles();
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  });
</script>

<div class="fixed inset-0 -z-10 overflow-hidden bg-black">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.08),transparent_70%)]"
       style="transform: translate({mouseX * 20}px, {mouseY * 20}px); transition: transform 0.3s ease;">
  </div>
  
  <div class="absolute inset-0 opacity-30">
    {#each particles as p, i}
      <div class="absolute rounded-full"
           style="left: {p.x}%; top: {p.y}%; width: {p.size}px; height: {p.size}px;
                  background: {COLORS[i % COLORS.length]};
                  opacity: {p.opacity};
                  animation: float {10 / p.speed}s ease-in-out infinite;
                  animation-delay: {i * 0.3}s;
                  transform: translate({mouseX * 15 * p.speed}px, {mouseY * 15 * p.speed}px);">
      </div>
    {/each}
  </div>
  
  <div class="absolute top-1/2 left-1/2 w-[60vmin] h-[60vmin] -translate-x-1/2 -translate-y-1/2"
       style="border: 1px solid rgba(124,58,237,0.08); border-radius: 50%;
              animation: blobPulse 6s ease-in-out infinite;">
  </div>
  
  <div class="absolute top-1/2 left-1/2 w-[40vmin] h-[40vmin] -translate-x-1/2 -translate-y-1/2"
       style="border: 1px solid rgba(124,58,237,0.05); border-radius: 50%;
              animation: blobPulse 8s ease-in-out infinite reverse;">
  </div>
</div>

<style>
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes blobPulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
  }
</style>
