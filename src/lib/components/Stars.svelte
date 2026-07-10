<script lang="ts">
  import { Star } from '@lucide/svelte';
  // Read-only star display. `value` 0–5 (supports halves via rounding), `size` in px.
  let { value = 0, size = 12 }: { value?: number; size?: number } = $props();
  const full = $derived(Math.round(Number(value) || 0));
</script>

<span class="inline-flex items-center gap-0.5 align-middle">
  {#each [1, 2, 3, 4, 5] as i}
    <Star
      size={size}
      class={i <= full ? 'text-aura-gold fill-aura-gold' : 'text-gray-600'}
    />
  {/each}
</span>
