<script lang="ts">
  import { Shield, FileText, BarChart3, Mail, Phone } from '@lucide/svelte';
  import Logo from './Logo.svelte';
</script>

<footer class="bg-[#080b09] border-t border-aura-gold/15 py-12 px-6 mt-auto">
  <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
    <div class="col-span-1 md:col-span-1">
      <div class="mb-4">
        <Logo />
      </div>
      <p class="text-gray-500 text-sm leading-relaxed mt-4">
        Bangladesh's unified AI marketplace — every brand, showroom & shop in one place, made effortless by the Aura Neural Grid.
      </p>
      <div class="mt-4 space-y-1.5">
        <a href="mailto:support@snehalata.com" class="flex items-center gap-2 text-sm text-gray-400 hover:text-aura-green transition-colors">
          <Mail size={14} class="text-aura-green" /> support@snehalata.com <span class="text-[10px] text-gray-600">· গ্রাহক</span>
        </a>
        <a href="mailto:info@snehalata.com" class="flex items-center gap-2 text-sm text-gray-400 hover:text-aura-green transition-colors">
          <Mail size={14} class="text-aura-gold" /> info@snehalata.com <span class="text-[10px] text-gray-600">· অফিসিয়াল</span>
        </a>
      </div>
    </div>

    <div>
      <h4 class="text-white font-bold uppercase tracking-widest text-xs mb-4">Shop</h4>
      <ul class="space-y-2 text-sm text-gray-400">
        <li><a href="/" class="hover:text-aura-green transition-colors">Browse Products</a></li>
        <li><a href="/studio" class="hover:text-aura-green transition-colors">Aura Studio · Try-On</a></li>
        <li><a href="/heritage" class="hover:text-aura-green transition-colors">তাঁতি ও মানবিকতা</a></li>
        <li><a href="/tracking" class="hover:text-aura-green transition-colors">Track My Order</a></li>
      </ul>
    </div>

    <div>
      <h4 class="text-white font-bold uppercase tracking-widest text-xs mb-4">For Sellers</h4>
      <ul class="space-y-2 text-sm text-gray-400">
        <li><a href="/sell" class="text-aura-gold/90 hover:text-aura-gold transition-colors">Sell on Snehalata</a></li>
        <li><a href="/onboarding" class="hover:text-aura-green transition-colors">Become a Vendor</a></li>
        <li><a href="/dashboard" class="hover:text-aura-green transition-colors">Vendor Login</a></li>
        <li><a href="tel:01911877091" class="flex items-center gap-2 hover:text-aura-green transition-colors"><Phone size={13} class="text-aura-green" /> 01911-877091</a></li>
        <li><a href="https://wa.me/8801911877091" target="_blank" rel="noopener" class="text-[11px] text-gray-500 hover:text-aura-green transition-colors">দোকান খুলতে WhatsApp করুন →</a></li>
      </ul>
    </div>

    <div>
      <h4 class="text-white font-bold uppercase tracking-widest text-xs mb-4">Legal</h4>
      <ul class="space-y-2 text-sm text-gray-400">
        <li>
          <a href="/legal" class="flex items-center gap-2 hover:text-aura-green transition-colors">
            <Shield size={14} /> Privacy Policy
          </a>
        </li>
        <li>
          <a href="/legal" class="flex items-center gap-2 hover:text-aura-green transition-colors">
            <FileText size={14} /> Terms of Service
          </a>
        </li>
      </ul>
      <a href="/admin-login" class="inline-flex items-center gap-2 mt-4 text-[10px] text-gray-600 hover:text-aura-green transition-colors">
        <BarChart3 size={12} /> Admin Gateway
      </a>
    </div>
  </div>
  
  <div class="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
    <p>&copy; {new Date().getFullYear()} Snehalata Ecosystem. All rights reserved.</p>
    <p>Powered by <span class="text-aura-gold/80 font-semibold tracking-wide">Aura Neural Engine</span> v3.1</p>
  </div>
</footer>
