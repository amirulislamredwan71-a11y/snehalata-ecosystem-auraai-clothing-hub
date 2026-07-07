<script lang="ts">
  import { goto } from '$app/navigation';
  import { ShieldCheck, Mail, Lock, ChevronRight, AlertCircle, Loader2 } from '@lucide/svelte';
  import { fade } from 'svelte/transition';

  let credentials = $state({ email: '', password: '' });
  let error: string | null = $state(null);
  let isLoading = $state(false);

  function handleSubmit(e: Event) {
    e.preventDefault();
    isLoading = true;
    error = null;

    setTimeout(() => {
      if (credentials.email === 'snehalatabestonline@gmail.com' && credentials.password === 'Snehalata26@&') {
        localStorage.setItem('aura_admin_token', 'aura_root_access_' + Date.now());
        localStorage.setItem('aura_admin_pass', credentials.password);
        goto('/ceo-dashboard');
      } else {
        error = 'Invalid administrative credentials. Access denied by Aura Governance.';
      }
      isLoading = false;
    }, 1500);
  }
</script>

<div class="min-h-screen bg-black flex items-center justify-center px-6 py-20 relative overflow-hidden">
  <div class="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
    <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-aura-green/5 blur-[120px] rounded-full animate-pulse" />
    <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-900/5 blur-[120px] rounded-full animate-pulse" style="animation-delay: 1s" />
  </div>

  <div class="w-full max-w-md relative z-10">
    <div class="text-center mb-10">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-aura-green/10 border border-aura-green/20 rounded-3xl mb-6 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
        <ShieldCheck size={40} class="text-aura-green" />
      </div>
      <h1 class="text-4xl font-serif font-black text-white mb-2 uppercase tracking-tight">Admin Gateway</h1>
      <p class="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-bold">Aura Ecosystem Command Line</p>
    </div>

    <div class="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative group">
      <div class="absolute -inset-[1px] bg-gradient-to-r from-aura-green/20 via-transparent to-aura-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-[2.5rem]" />

      <form onsubmit={handleSubmit} class="space-y-6 relative z-10">
        {#if error}
          <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3" transition:fade>
            <AlertCircle size={18} class="text-red-500 shrink-0 mt-0.5" />
            <p class="text-xs text-red-400 font-medium leading-relaxed">{error}</p>
          </div>
        {/if}

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Admin Email</label>
            <div class="relative group">
              <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><Mail size={18} /></div>
              <input type="email" required bind:value={credentials.email} placeholder="snehalata@bestonline.com" class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-sm text-white focus:outline-none focus:border-aura-green transition-all placeholder:text-gray-800" />
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Protocol Key (Password)</label>
            <div class="relative group">
              <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><Lock size={18} /></div>
              <input type="password" required bind:value={credentials.password} placeholder="••••••••" class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-sm text-white focus:outline-none focus:border-aura-green transition-all placeholder:text-gray-800" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={isLoading} class="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-aura-green hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">
          {#if isLoading}
            <Loader2 size={18} class="animate-spin text-aura-green" />
          {:else}
            Verify Identity <ChevronRight size={18} />
          {/if}
        </button>
      </form>
    </div>

    <div class="mt-10 text-center">
      <a href="/" class="text-gray-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em]">
        Return to Public Hub
      </a>
    </div>
  </div>
</div>
