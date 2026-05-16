<script lang="ts">
  import { Shield, FileText, BarChart3 } from '@lucide/svelte';
  import Logo from './Logo.svelte';
</script>

<footer class="bg-black border-t border-white/[0.08] py-12 px-6 mt-auto">
  <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
    <div class="col-span-1 md:col-span-1">
      <div class="mb-4">
        <Logo />
      </div>
      <p class="text-gray-500 text-sm leading-relaxed mt-4">
        The ultimate AI-powered ecosystem empowering local artisans with global standard technology.
      </p>
    </div>

    <div>
      <h4 class="text-white font-bold uppercase tracking-widest text-xs mb-4">Platform</h4>
      <ul class="space-y-2 text-sm text-gray-400">
        <li><a href="/" class="hover:text-aura-purple transition-colors">Ecosystem Hub</a></li>
        <li><a href="/onboarding" class="hover:text-aura-purple transition-colors">Vendor Registration</a></li>
        <li><a href="/tracking" class="hover:text-aura-purple transition-colors">Order Tracking</a></li>
      </ul>
    </div>

    <div>
      <h4 class="text-white font-bold uppercase tracking-widest text-xs mb-4">Legal & Privacy</h4>
      <ul class="space-y-2 text-sm text-gray-400">
        <li>
          <a href="/legal" class="flex items-center gap-2 hover:text-aura-purple transition-colors">
            <Shield size={14} /> Privacy Policy
          </a>
        </li>
        <li>
          <a href="/legal" class="flex items-center gap-2 hover:text-aura-purple transition-colors">
            <FileText size={14} /> Terms of Service
          </a>
        </li>
      </ul>
    </div>

    <div>
      <h4 class="text-white font-bold uppercase tracking-widest text-xs mb-4">Governance</h4>
      <a href="/admin-login" class="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-aura-purple hover:text-white transition-all hover:scale-105">
        <BarChart3 size={16} /> Admin Gateway
      </a>
      <p class="text-[10px] text-gray-600 mt-2">Restricted Access • Aura AI Monitored</p>
    </div>
  </div>
  
  <div class="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
    <p>&copy; {new Date().getFullYear()} Snehalata Ecosystem. All rights reserved.</p>
    <p>Powered by Aura Neural Engine v3.1</p>
  </div>
</footer>
