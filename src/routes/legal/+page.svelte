<script lang="ts">
  import { FileText, Lock } from '@lucide/svelte';
</script>

<div class="min-h-screen bg-black pb-20">
  <div class="max-w-4xl mx-auto px-6 py-16">
    <a href="/" class="text-gray-500 hover:text-white mb-8 inline-block text-sm uppercase tracking-widest">← Back to Hub</a>

    <div class="mb-16 text-center">
      <h1 class="text-4xl font-serif font-bold text-white mb-4">Legal & Privacy Center</h1>
      <p class="text-gray-400">Aura Ecosystem Governance Protocol</p>
    </div>

    <div class="space-y-12">
      <section class="bg-aura-glass border border-aura-glassBorder p-8 rounded-3xl">
        <div class="flex items-center gap-3 mb-6">
          <Lock class="text-aura-purple" />
          <h2 class="text-2xl font-bold text-white">Privacy Policy</h2>
        </div>
        <div class="space-y-4 text-gray-300 leading-relaxed font-light">
          <p>
            <strong>1. Data Collection:</strong> Snehalata Ecosystem collects minimal data required for order processing and AI personalization. Your biometric data for "Virtual Try-On" is processed instantly and never stored permanently on our servers.
          </p>
          <p>
            <strong>2. Vendor Data:</strong> Vendor analytics and trade secrets are encrypted. Aura AI uses this data solely to provide business insights to the specific vendor.
          </p>
          <p>
            <strong>3. AI Transparency:</strong> Interaction with Aura AI is monitored for quality assurance. We do not sell your conversational data to third parties.
          </p>
        </div>
      </section>

      <section class="bg-aura-glass border border-aura-glassBorder p-8 rounded-3xl">
        <div class="flex items-center gap-3 mb-6">
          <FileText class="text-aura-purple" />
          <h2 class="text-2xl font-bold text-white">Terms & Conditions</h2>
        </div>
        <div class="space-y-4 text-gray-300 leading-relaxed font-light">
          <p>
            <strong>1. Vendor Obligations:</strong> All vendors using the "1-Click Website Generator" must comply with Bangladesh Digital Commerce Guidelines 2021. Selling counterfeit goods results in an immediate ban.
          </p>
          <p>
            <strong>2. Return Policy:</strong> Vendors define their own return windows, but Aura Governance mandates a minimum 3-day inspection period for customers.
          </p>
          <p>
            <strong>3. Platform Fees:</strong> Currently, the platform operates on a 0% commission model (Beta Phase). Future fee structures will be communicated 30 days in advance.
          </p>
        </div>
      </section>
    </div>
  </div>
</div>
