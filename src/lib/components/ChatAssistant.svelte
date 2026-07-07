<script lang="ts">
  import { MessageSquare, X, Sparkles, Bot, User, Loader2, Cpu, Download, Image as ImageIcon, Trash2, ArrowUp, Paperclip } from '@lucide/svelte';
  import { generateAuraImage, generateAuraResponse, editAuraImage, resetAuraChat } from '$lib/geminiService';
  import { fileToCompressedDataURL } from '$lib/imageUpload';
  import { fade, fly, scale } from 'svelte/transition';
  import type { ChatMessage } from '$lib/types';

  let attachedImage = $state<string | null>(null);

  async function handleImageAttach(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) attachedImage = await fileToCompressedDataURL(file);
    input.value = '';
  }

  let { embedded = false, className = '' }: { embedded?: boolean; className?: string } = $props();

  let isOpen = $state(false);
  let messages = $state<ChatMessage[]>(embedded ? [{
    id: 'initial',
    text: 'আসসালামু আলাইকুম! আমি Aura AI। আমি আপনার জন্য তথ্য দিতে পারি অথবা আপনার কল্পনা অনুযায়ী চমৎকার ছবি তৈরি করে দিতে পারি। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
    sender: 'aura',
  }] : []);
  let input = $state('');
  let isTyping = $state(false);
  let isGeneratingImage = $state(false);
  let messagesEnd: HTMLDivElement;

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function isImageRequest(text: string) {
    const keywords = ['image', 'picture', 'photo', 'drawing', 'ছবি', 'পিকচার', 'আঁকো', 'তৈরি করো', 'create', 'generate'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  $effect(() => {
    if (messagesEnd) messagesEnd.scrollIntoView({ behavior: 'smooth' });
  });

  function handleToggle() {
    isOpen = !isOpen;
    if (isOpen && messages.length === 0) {
      messages = [{
        id: 'initial',
        text: 'আসসালামু আলাইকুম! আমি Aura AI। আমি আপনার জন্য তথ্য দিতে পারি অথবা আপনার কল্পনা অনুযায়ী চমৎকার ছবি তৈরি করে দিতে পারি। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
        sender: 'aura',
      }];
    }
  }

  function handleClearChat() {
    messages = [{
      id: 'cleared',
      text: 'চ্যাট ইতিহাস মুছে ফেলা হয়েছে। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
      sender: 'aura',
    }];
    resetAuraChat();
  }

  async function handleSendMessage() {
    if ((!input.trim() && !attachedImage) || isTyping || isGeneratingImage) return;

    const currentInput = input.trim();
    const img = attachedImage;
    const userMsg: ChatMessage = { id: Date.now().toString(), text: currentInput || 'এই ছবিটি এডিট করে দাও', sender: 'user', image: img || undefined };
    messages = [...messages, userMsg];
    input = '';
    attachedImage = null;
    isTyping = true;

    try {
      // Uploaded photo → AI edit / restyle (Aura Vision). Full product Try-On lives in Aura Studio.
      if (img) {
        isGeneratingImage = true;
        const instruction = currentInput || 'Enhance this clothing/outfit photo: clean studio background, soft even lighting, keep the garment realistic and flattering.';
        const edited = await editAuraImage(instruction, img);
        messages = [...messages, edited.image
          ? { id: Date.now().toString(), text: 'এই যে আপনার ছবিটি Aura Vision দিয়ে এডিট করে দিলাম ✨ (পুরো Virtual Try-On করতে Aura Studio ব্যবহার করুন।)', sender: 'aura', image: edited.image }
          : { id: Date.now().toString(), text: edited.error || 'ছবিটি এই মুহূর্তে এডিট করা যাচ্ছে না — Aura একটু ব্যস্ত, একটু পরে আবার চেষ্টা করুন 🙏', sender: 'aura' }];
        isGeneratingImage = false; isTyping = false;
        return;
      }

      if (isImageRequest(currentInput)) {
        isGeneratingImage = true;
        const imageUrl = await generateAuraImage(currentInput);
        if (imageUrl) {
          messages = [...messages, {
            id: Date.now().toString(),
            text: `আপনার অনুরোধ অনুযায়ী আমি এই ছবিটি তৈরি করেছি: "${currentInput}"`,
            sender: 'aura',
            image: imageUrl,
          }];
          isGeneratingImage = false;
          isTyping = false;
          return;
        }
      }

      const responseText = await generateAuraResponse(currentInput);
      messages = [...messages, { id: Date.now().toString(), text: responseText, sender: 'aura' }];
    } catch {
      messages = [...messages, {
        id: Date.now().toString(),
        text: 'একটি টেকনিক্যাল সমস্যা হয়েছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
        sender: 'aura',
      }];
    } finally {
      isTyping = false;
      isGeneratingImage = false;
    }
  }

</script>

<div class={embedded ? `relative w-full max-w-2xl mx-auto z-20 font-sans my-10 ${className}` : `fixed bottom-24 left-4 lg:bottom-6 lg:left-6 z-[150] font-sans`}>
  {#if !embedded}
    <div class="flex flex-col items-start gap-2">
      {#if isOpen}
        <button onclick={handleToggle} aria-label="Close Aura assistant"
          class="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl bg-white text-black rotate-90 scale-90 transition-all duration-500 cursor-pointer">
          <X size={24} />
        </button>
      {:else}
        <button onclick={handleToggle} transition:scale
          class="group flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full bg-gradient-to-br from-aura-green-deep to-aura-green-bright text-black shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer">
          <span class="relative flex items-center justify-center w-7 h-7 rounded-full bg-black/10">
            <span class="absolute inset-0 rounded-full bg-black/10 animate-ping"></span>
            <MessageSquare size={16} />
          </span>
          <span class="text-[12px] font-black tracking-tight whitespace-nowrap leading-none">Aura AI Shopping<br />Assistant</span>
        </button>
      {/if}
    </div>
  {/if}

  {#if isOpen || embedded}
    <div class={embedded
      ? "w-full h-[380px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[2.5rem] shadow-[0_0_80px_rgba(16,185,129,0.15)] backdrop-blur-3xl flex flex-col overflow-hidden"
      : "absolute bottom-20 left-0 w-[400px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-10rem)] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[2.5rem] shadow-2xl backdrop-blur-3xl flex flex-col overflow-hidden"}
      transition:fly={{ y: 20, duration: 300, opacity: 1 }}>
      
      <header class="p-5 bg-white/5 border-b border-white/5 flex items-center justify-between relative overflow-hidden shrink-0">
        <div class="absolute top-0 left-0 w-full h-full bg-[#10b981]/5 blur-[40px] pointer-events-none" />
        <div class="flex items-center gap-3 relative z-10">
          <div class="w-9 h-9 bg-[#10b981]/20 rounded-xl flex items-center justify-center border border-[#10b981]/30">
            <Cpu size={18} class="text-[#10b981]" />
          </div>
          <div>
            <h3 class="text-white font-bold text-xs tracking-widest flex items-center gap-2">
              AURA INTELLIGENCE <Sparkles size={10} class="text-[#10b981]" />
            </h3>
            <p class="text-[8px] uppercase tracking-[0.2em] font-black flex items-center gap-2 mt-0.5">
              {#if isTyping}
                <span class="text-[#10b981] animate-pulse">Thinking...</span>
              {:else}
                <span class="text-green-400 flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-green-400"></span> Online</span>
              {/if}
            </p>
          </div>
        </div>
        <div class="relative z-10">
          <button onclick={handleClearChat} class="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-all group cursor-pointer"
            title="Clear Chat History">
            <Trash2 size={16} class="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
        {#each messages as msg, i (msg.id)}
          <div class="flex {msg.sender === 'user' ? 'justify-end' : 'justify-start'}" transition:fade={{ duration: 200 }}>
            <div class="flex gap-2.5 max-w-[85%] {msg.sender === 'user' ? 'flex-row-reverse' : ''}">
              <div class="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border {msg.sender === 'user' ? 'bg-white/10 border-white/10' : 'bg-[#10b981]/20 border-[#10b981]/30'}">
                {#if msg.sender === 'user'}
                  <User size={12} class="text-gray-400" />
                {:else}
                  <Bot size={12} class="text-[#10b981]" />
                {/if}
              </div>
              <div class="space-y-1">
                <div class="px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm {msg.sender === 'user' ? 'bg-white text-black font-medium rounded-tr-none' : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'}">
                  {msg.text}
                </div>
                {#if msg.image}
                  <div class="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/40 mt-2" transition:scale={{ duration: 300 }}>
                    <img src={msg.image} class="w-full h-auto object-cover" alt="AI Generated" />
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={msg.image} download="aura-ai-art.png"
                        class="p-2.5 bg-white text-black rounded-xl hover:bg-[#10b981] hover:text-white transition-all shadow-2xl">
                        <Download size={14} />
                      </a>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}

        {#if isTyping || isGeneratingImage}
          <div class="flex justify-start" transition:fade>
            <div class="flex gap-2.5 max-w-[90%]">
              <div class="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border bg-[#10b981]/20 border-[#10b981]/30">
                <Bot size={12} class="text-[#10b981]" />
              </div>
              <div class="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-3">
                {#if isGeneratingImage}
                  <ImageIcon size={12} class="text-[#10b981]" />
                  <span class="text-[9px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">Rendering...</span>
                {:else}
                  <div class="flex gap-1 h-2 items-center">
                    <div class="w-1 h-1 bg-[#10b981] rounded-full animate-bounce" style="animation-delay:-0.3s"></div>
                    <div class="w-1 h-1 bg-[#10b981] rounded-full animate-bounce" style="animation-delay:-0.15s"></div>
                    <div class="w-1 h-1 bg-[#10b981] rounded-full animate-bounce"></div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
        <div bind:this={messagesEnd} />
      </div>

      <form onsubmit={(e) => { e.preventDefault(); handleSendMessage(); }} class="p-4 bg-white/5 border-t border-white/5 shrink-0">
        {#if attachedImage}
          <div class="mb-2 flex items-center gap-2" transition:fade={{ duration: 150 }}>
            <img src={attachedImage} class="w-11 h-11 rounded-lg object-cover border border-white/10" alt="attached" />
            <span class="text-[9px] text-[#10b981] uppercase tracking-widest font-black">Photo attached — send to edit ✨</span>
            <button type="button" onclick={() => attachedImage = null} class="ml-auto text-gray-500 hover:text-red-400 cursor-pointer"><X size={14} /></button>
          </div>
        {/if}
        <div class="relative flex items-center">
          <label class="absolute left-2 w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer text-gray-500 hover:text-[#10b981] transition-colors" title="Attach a photo to edit">
            <input type="file" accept="image/*" onchange={handleImageAttach} class="hidden" />
            <Paperclip size={16} />
          </label>
          <input type="text" bind:value={input}
            placeholder="Ask Aura, or attach a photo to edit..."
            class="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-12 py-3.5 text-[11px] text-white focus:outline-none focus:border-[#10b981]/50 transition-all placeholder:text-gray-600 font-medium tracking-wide shadow-inner" />
          <button type="submit" disabled={(!input.trim() && !attachedImage) || isTyping || isGeneratingImage}
            class="absolute right-2 w-8 h-8 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed {((input.trim() || attachedImage) && !isTyping && !isGeneratingImage) ? 'bg-[#10b981] text-white' : 'text-gray-600 bg-transparent'}">
            {#if isTyping || isGeneratingImage}
              <Loader2 size={14} class="animate-spin" />
            {:else}
              <ArrowUp size={16} stroke-width={3} />
            {/if}
          </button>
        </div>
        <p class="text-[7px] text-center text-gray-700 uppercase tracking-widest font-black mt-3 opacity-50">
          Aura Vision Module v2.5 Active
        </p>
      </form>
    </div>
  {/if}
</div>
