<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import FloatingCart from '$lib/components/FloatingCart.svelte';
  import ChatAssistant from '$lib/components/ChatAssistant.svelte';
  import NeuralBackground from '$lib/components/NeuralBackground.svelte';
  import { browser } from '$app/environment';
  import { syncWithNeuralGrid } from '$lib/mockData';

  let { children } = $props();

  $effect(() => {
    if (browser) syncWithNeuralGrid();
  });
</script>

<NeuralBackground />
<div class="bg-aura-glow">
  <div class="glow-orb top-[-20%] left-[-10%]" />
  <div class="glow-orb bottom-[-20%] right-[-10%] top-auto" />
</div>

<div class="min-h-screen flex flex-col">
  <Nav />
  <main class="flex-1">
    {@render children()}
  </main>
  <Footer />
</div>

<FloatingCart />
<ChatAssistant />
