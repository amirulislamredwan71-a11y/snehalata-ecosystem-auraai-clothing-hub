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

<svelte:head>
  <title>SNEHALATA Aura — AI Neural Ecosystem</title>
  <meta
    name="description"
    content="স্নেহলতা Aura — AI-powered ecosystem empowering local Bangladeshi artisans with global-standard technology." />
  <meta name="theme-color" content="#7c3aed" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="SNEHALATA Aura" />
  <meta property="og:image" content="https://www.snehalata.com/og-cover.svg" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

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
