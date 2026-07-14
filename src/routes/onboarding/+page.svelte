<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { fade, fly, scale } from 'svelte/transition';
  import {
    ShieldCheck, AlertTriangle, Loader2, Sparkles, Building2,
    LogIn, FileText, ChevronRight, CheckCircle2, Globe,
    Wand2, Cpu, ArrowLeft, LayoutDashboard, Shirt, Check,
    Tag, MapPin, Phone, Eye, EyeOff
  } from '@lucide/svelte';
  let showPw = $state(false);
  import { auditVendorDescription } from '$lib/geminiService';
  import { siteCategories } from '$lib/ui';
  import { BD_LOCATIONS } from '$lib/locationData';

  // The vendor's Primary Category = the SAME live category list the home + admin use
  // (site-config, admin-editable), not the old 3-row legacy `categories` table.
  const categories = $derived($siteCategories.filter((c: any) => c.id !== 'all'));
  let formData = $state({
    ownerName: '',
    shopName: '',
    phone: '',
    email: '',
    password: '',
    description: '',
    tradeLicense: '',
    websiteUrl: '',
    district: '',
    area: '',
    categoryId: '',
    vendorType: 'EXTERNAL_BRIDGE'
  });


  let step = $state(1);
  let status = $state<'IDLE' | 'AUDITING' | 'SAVING' | 'SUCCESS' | 'REJECTED' | 'PENDING_HUB'>('IDLE');
  let auditResult = $state<{ status: string; reason: string } | null>(null);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    status = 'AUDITING';

    try {
      const audit = await auditVendorDescription(formData.shopName, formData.description, formData.tradeLicense);
      auditResult = audit;

      if (audit.status === 'REJECTED') {
        status = 'REJECTED';
        return;
      }

      status = 'SAVING';

      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: formData.shopName,
          ownerName: formData.ownerName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          description: formData.description,
          websiteUrl: formData.websiteUrl,
          district: formData.district,
          area: formData.area,
          category: formData.categoryId || null,
          category_id: formData.categoryId || null,
          vendorType: formData.vendorType
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      status = 'SUCCESS';
    } catch (error: any) {
      console.error("Neural Onboarding Error:", error);
      status = 'REJECTED';
      auditResult = { status: 'REJECTED', reason: error.message };
    }
  }

  function handleRetry() {
    status = 'IDLE';
    step = 1;
  }
</script>

<div class="min-h-screen bg-aura-black pb-32 pt-12 px-6 relative overflow-hidden">
  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
    <div class="absolute top-20 right-0 w-[500px] h-[500px] bg-aura-green/5 blur-[120px] rounded-full" />
    <div class="absolute bottom-20 left-0 w-[500px] h-[500px] bg-indigo-900/5 blur-[120px] rounded-full" />
  </div>

  <div class="max-w-7xl mx-auto relative z-10">
    <a href="/" class="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-[10px] font-black uppercase tracking-[0.3em]">
      <ArrowLeft size={14} /> Back to Hub
    </a>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
      <div class="space-y-10 lg:sticky lg:top-24">
        <div>
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-aura-gold/10 border border-aura-gold/20 mb-6">
            <Sparkles size={14} class="text-aura-gold" />
            <span class="text-[10px] font-black uppercase tracking-widest text-aura-gold">Artisan Revolution v3.0</span>
          </div>
          <h1 class="text-5xl md:text-6xl font-serif font-black text-white mb-6 leading-tight">
            Scale Your <span class="text-aura-gold">Heritage</span>
          </h1>
          <p class="text-gray-400 text-lg leading-relaxed max-w-xl">
            Join the SNEHALATA ecosystem. Aura AI verifies your authenticity and deploys your digital storefront globally in seconds.
          </p>
        </div>

        <div class="space-y-6">
          <div class="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-aura-green/50 transition-all group hover:bg-white/[0.07]">
            <div class="flex items-center gap-4 mb-6">
              <div class="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h3 class="text-xl font-bold text-white">Vendor Console</h3>
                <p class="text-[10px] uppercase tracking-widest text-gray-500 font-black">Admin Command Center</p>
              </div>
            </div>
            <ul class="space-y-3">
              <li class="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wide"><Check size={14} class="text-aura-green" />1-Click Website Generator</li>
              <li class="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wide"><Check size={14} class="text-aura-green" />Automatic Subdomain Creation</li>
              <li class="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wide"><Check size={14} class="text-aura-green" />Free AI Analytics & Insights</li>
              <li class="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wide"><Check size={14} class="text-aura-green" />Automated Inventory Audits</li>
            </ul>
          </div>

          <div class="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-aura-green/50 transition-all group hover:bg-white/[0.07]">
            <div class="flex items-center gap-4 mb-6">
              <div class="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-lg">
                <Shirt size={24} />
              </div>
              <div>
                <h3 class="text-xl font-bold text-white">Virtual Try-On Engine</h3>
                <p class="text-[10px] uppercase tracking-widest text-gray-500 font-black">Neural Style Transfer</p>
              </div>
            </div>
            <ul class="space-y-3">
              <li class="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wide"><Check size={14} class="text-aura-green" />Customer Image Upload Support</li>
              <li class="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wide"><Check size={14} class="text-aura-green" />Real-time Neural Processing</li>
              <li class="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wide"><Check size={14} class="text-aura-green" />Live Product Overlay Preview</li>
              <li class="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wide"><Check size={14} class="text-aura-green" />Interactive Size Guide</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="bg-aura-glass border border-aura-glassBorder rounded-[3rem] p-1 shadow-2xl overflow-hidden relative group">
        <div class="absolute -inset-[1px] bg-gradient-to-r from-aura-green/20 via-transparent to-aura-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

        <div class="bg-aura-black/60 backdrop-blur-3xl rounded-[2.9rem] p-8 md:p-12 relative z-10">
          {#if status !== 'SUCCESS' && status !== 'PENDING_HUB' && status !== 'REJECTED'}
            <div class="flex items-center justify-center gap-4 mb-10">
              {#each [1, 2] as s}
                <div class="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black transition-all duration-500 {step >= s ? 'bg-aura-green border-aura-green text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10 text-gray-600'}">
                  {#if step > s}
                    <CheckCircle2 size={14} />
                  {:else}
                    {s}
                  {/if}
                </div>
                {#if s < 2}
                  <div class="w-12 h-0.5 rounded-full transition-all duration-700 {step > s ? 'bg-aura-green' : 'bg-white/5'}" />
                {/if}
              {/each}
            </div>
          {/if}

          {#if status === 'SUCCESS'}
            <div class="text-center py-10" transition:scale={{ duration: 500 }}>
              <div class="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative">
                <div class="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse" />
                <ShieldCheck size={48} class="text-green-400 relative z-10" />
              </div>
              <h2 class="text-3xl font-serif font-bold text-white mb-4">Registration Submitted</h2>
              <p class="text-gray-400 text-sm mb-4 max-w-sm mx-auto leading-relaxed">Your node is <span class="text-amber-400 font-bold">pending SNEHALATA approval</span>. Sign in to your dashboard now — product sync & your storefront go live once an admin approves.</p>
              <p class="text-gray-600 text-[11px] mb-10 max-w-sm mx-auto italic">{auditResult?.reason}</p>
              <a href="/dashboard" class="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-aura-green hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 w-fit mx-auto">
                Sign In to Dashboard <ChevronRight size={18} />
              </a>
            </div>
          {:else if status === 'PENDING_HUB'}
            <div class="text-center py-10" transition:scale={{ duration: 500 }}>
              <div class="w-24 h-24 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <Loader2 size={48} class="text-amber-400 animate-spin" />
              </div>
              <h2 class="text-3xl font-serif font-bold text-white mb-4">Audit in Progress</h2>
              <div class="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl mb-10 max-w-md mx-auto">
                <p class="text-xs text-amber-400 leading-relaxed font-bold uppercase tracking-widest mb-2">Aura Insight:</p>
                <p class="text-sm text-gray-400 italic">"{auditResult?.reason}"</p>
              </div>
              <a href="/" class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white transition-colors">Return to Neural Hub</a>
            </div>
          {:else if status === 'REJECTED'}
            <div class="text-center py-10" transition:fade>
              <div class="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <AlertTriangle size={48} class="text-red-400" />
              </div>
              <h2 class="text-3xl font-serif font-bold text-red-500 mb-4">Compliance Failed</h2>
              <p class="text-gray-400 text-sm mb-10 bg-red-500/5 border border-red-500/10 p-6 rounded-3xl italic">"{auditResult?.reason}"</p>
              <button onclick={handleRetry} class="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer">
                Refine Application
              </button>
            </div>
          {:else}
            <form onsubmit={handleSubmit} class="space-y-10">
              {#if step === 1}
                <div class="space-y-8" transition:fly={{ x: 20, duration: 300 }}>
                  <div class="flex items-center gap-4 mb-4">
                    <div class="p-3 bg-aura-green/10 rounded-2xl"><Cpu class="text-aura-green" /></div>
                    <div>
                      <h3 class="text-xl font-serif font-bold text-white">Identity Sync</h3>
                      <p class="text-[10px] uppercase tracking-widest text-gray-500">Step 01: Core Brand Profile</p>
                    </div>
                  </div>

                  <div class="space-y-6">
                    <div class="space-y-2">
                      <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Artisan Owner</label>
                      <div class="relative group">
                        <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><LogIn size={18} /></div>
                        <input type="text" bind:value={formData.ownerName} placeholder="Ex: Shafi Ahmed" required
                          class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-aura-green transition-all placeholder:text-gray-800" />
                      </div>
                    </div>

                    <div class="space-y-2">
                      <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">মোবাইল নম্বর · Phone <span class="text-aura-green">*</span></label>
                      <div class="relative group">
                        <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><Phone size={18} /></div>
                        <input type="tel" bind:value={formData.phone} placeholder="Ex: 01712XXXXXX" required inputmode="numeric"
                          class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-aura-green transition-all placeholder:text-gray-800" />
                      </div>
                      <p class="text-[9px] text-gray-600 px-1">এই নম্বর দিয়েই লগইন করবেন (email ঐচ্ছিক)।</p>
                    </div>

                    <div class="space-y-2">
                      <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Email <span class="text-gray-600 normal-case">(ঐচ্ছিক)</span></label>
                      <div class="relative group">
                        <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><Globe size={18} /></div>
                        <input type="email" bind:value={formData.email} placeholder="Ex: shafi@example.com (optional)"
                          class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-aura-green transition-all placeholder:text-gray-800" />
                      </div>
                    </div>

                    <div class="space-y-2">
                      <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Dashboard Password</label>
                      <div class="relative group">
                        <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><ShieldCheck size={18} /></div>
                        <input type={showPw ? 'text' : 'password'} bind:value={formData.password} placeholder="Set a password (min 6 characters)" required minlength="6"
                          class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-14 py-4 text-sm text-white focus:outline-none focus:border-aura-green transition-all placeholder:text-gray-800" />
                        <button type="button" onclick={() => (showPw = !showPw)} aria-label="Show password" class="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-aura-green transition-colors cursor-pointer">
                          {#if showPw}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
                        </button>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Brand Name</label>
                      <div class="relative group">
                        <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><Building2 size={18} /></div>
                        <input type="text" bind:value={formData.shopName} placeholder="Ex: Dhakai Muslin Heritage" required
                          class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-aura-green transition-all placeholder:text-gray-800" />
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">District</label>
                        <div class="relative group">
                          <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><MapPin size={18} /></div>
                          <select
                            bind:value={formData.district}
                            onchange={() => formData.area = ''}
                            class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-aura-green transition-all appearance-none cursor-pointer"
                            required>
                            <option value="" class="bg-black text-white">Select District</option>
                            {#each Object.keys(BD_LOCATIONS).sort() as d}
                              <option value={d} class="bg-black text-white">{d}</option>
                            {/each}
                          </select>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Area/Upazila</label>
                        <div class="relative group">
                          <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><MapPin size={18} /></div>
                          <select
                            bind:value={formData.area}
                            disabled={!formData.district}
                            class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-aura-green transition-all appearance-none cursor-pointer disabled:opacity-50"
                            required>
                            <option value="" class="bg-black text-white">Select Area</option>
                            {#if formData.district}
                              {#each BD_LOCATIONS[formData.district] as a}
                                <option value={a} class="bg-black text-white">{a}</option>
                              {/each}
                            {/if}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Integration Model</label>
                      <div class="grid grid-cols-2 gap-4">
                        <button type="button" onclick={() => formData.vendorType = 'SUBDOMAIN'}
                          class="p-4 rounded-2xl border transition-all text-left cursor-pointer {formData.vendorType === 'SUBDOMAIN' ? 'bg-aura-green/20 border-aura-green text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}">
                          <div class="flex items-center gap-2 mb-1">
                            <LayoutDashboard size={14} />
                            <span class="text-xs font-bold font-serif uppercase tracking-wider">Sub-domain</span>
                          </div>
                          <p class="text-[9px] opacity-60 leading-tight">Managed storefront on SNEHALATA Hub.</p>
                        </button>
                        <button type="button" onclick={() => formData.vendorType = 'EXTERNAL_BRIDGE'}
                          class="p-4 rounded-2xl border transition-all text-left cursor-pointer {formData.vendorType === 'EXTERNAL_BRIDGE' ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}">
                          <div class="flex items-center gap-2 mb-1">
                            <Globe size={14} />
                            <span class="text-xs font-bold font-serif uppercase tracking-wider">Neural Bridge</span>
                          </div>
                          <p class="text-[9px] opacity-60 leading-tight">Sync your existing brand website.</p>
                        </button>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Primary Category</label>
                      <div class="relative group">
                        <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><Tag size={18} /></div>
                        <select bind:value={formData.categoryId}
                          class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-aura-green transition-all appearance-none cursor-pointer" required>
                          <option value="" class="bg-black text-white">Select Ecosystem Node</option>
                          {#each categories as cat}
                            <option value={cat.id} class="bg-black text-white">{cat.name}</option>
                          {/each}
                        </select>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Existing Website (Optional)</label>
                      <div class="relative group">
                        <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><Globe size={18} /></div>
                        <input type="text" bind:value={formData.websiteUrl} placeholder="https://yourbrand.com"
                          class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-aura-green transition-all placeholder:text-gray-800" />
                      </div>
                    </div>
                  </div>

                  <div class="pt-6">
                    <button type="button" onclick={() => step = 2} class="w-full bg-white text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-aura-green hover:text-white transition-all shadow-xl cursor-pointer">
                      Next Stage <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              {/if}

              {#if step === 2}
                <div class="space-y-8" transition:fly={{ x: -20, duration: 300 }}>
                  <div class="flex items-center gap-4 mb-4">
                    <div class="p-3 bg-aura-green/10 rounded-2xl"><FileText class="text-aura-green" /></div>
                    <div>
                      <h3 class="text-xl font-serif font-bold text-white">Compliance Protocol</h3>
                      <p class="text-[10px] uppercase tracking-widest text-gray-500">Step 02: Verification Logic</p>
                    </div>
                  </div>

                  <div class="space-y-6">
                    <div class="space-y-2">
                      <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Trade License Number</label>
                      <div class="relative group">
                        <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-green transition-colors"><ShieldCheck size={18} /></div>
                        <input type="text" bind:value={formData.tradeLicense} placeholder="Ex: TRD-2024-XXXX" required
                          class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-aura-green transition-all placeholder:text-gray-800" />
                      </div>
                    </div>
                    <div class="space-y-3">
                      <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Heritage Narrative (Audited by Aura)</label>
                      <textarea required bind:value={formData.description}
                        class="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-white focus:outline-none focus:border-aura-green resize-none transition-all placeholder:text-gray-700"
                        placeholder="Describe your artisan methods, fabric count, and shop heritage for our AI audit..." />
                    </div>
                  </div>

                  <div class="pt-6 flex justify-between gap-4">
                    <button type="button" onclick={() => step = 1} class="text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest px-8 py-4 cursor-pointer">Back</button>
                    <button type="submit" disabled={status !== 'IDLE'} class="flex-1 bg-aura-green text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl disabled:opacity-50 cursor-pointer">
                      {#if status === 'AUDITING'}
                        <Loader2 class="animate-spin" size={18} />
                        Analyzing Authentication...
                      {:else}
                        <Wand2 size={18} />
                        Deploy Global Store
                      {/if}
                    </button>
                  </div>
                </div>
              {/if}
            </form>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>