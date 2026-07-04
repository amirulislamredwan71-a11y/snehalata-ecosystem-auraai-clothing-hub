// Groq — free, extremely fast LLM inference (OpenAI-compatible API). Used as a
// CROSS-PROVIDER fallback for Aura chat: when Gemini 503s ("high demand"), Groq
// keeps the assistant responsive so users always get a real answer.
// Needs GROQ_API_KEY (free from https://console.groq.com) in the environment;
// throws if absent so the caller can fall through gracefully.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const auraSystem = (inventory: string, vendors: string) =>
  `You are Aura AI, the shopping concierge for SNEHALATA — Bangladesh's unified AI marketplace that brings every brand, showroom and local shop into one place.
TONE: elegant, warm, concise, helpful. Persona: a sophisticated "Neural Guardian".
LANGUAGE: reply in the language the user writes in (Bengali or English). You may greet with "আসসালামু আলাইকুম" or "Greetings from the Grid".
RULES:
1. Only recommend products from the live catalog below; always mention the product name and price (৳).
2. Keep replies concise unless asked for detail.
3. If asked about order tracking, tell the user to use the Track Order page with their order ID.

VENDORS:
${vendors || '(none provided)'}

PRODUCTS:
${inventory || '(none provided)'}`;

export async function groqChat(message: string, inventory: string, vendors: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 800,
      messages: [
        { role: 'system', content: auraSystem(inventory, vendors) },
        { role: 'user', content: String(message || '').slice(0, 4000) }
      ]
    })
  });

  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned an empty response');
  return text as string;
}
