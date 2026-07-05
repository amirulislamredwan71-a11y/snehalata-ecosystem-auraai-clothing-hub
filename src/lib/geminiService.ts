import { getProducts, getVendors } from "$lib/mockData";
import type { Product } from "$lib/types";

export interface SearchIntent {
  category?: string;
  maxPrice?: number;
  material?: string;
  color?: string;
  style?: string;
  semanticKeywords?: string[];
}

const buildAuraStrings = () => {
  const products = getProducts();
  const vendors = getVendors();
  const vendorName = (id: number) => vendors.find(v => v.id === id)?.store_name || 'Independent Artisan';

  const productString = products
    .map(p => `- [ID:${p.id}] ${p.name} — ৳${p.price} — ${p.category} — by ${vendorName(p.vendorId)}${p.description ? ` — ${p.description.slice(0, 90)}` : ''}`)
    .join('\n');
  const vendorString = vendors
    .map(v => `- [Vendor:${v.id}] ${v.store_name} (${v.status})${v.district ? ` — ${v.district}` : ''}${v.description ? ` — ${v.description.slice(0, 90)}` : ''}`)
    .join('\n');

  return { productString, vendorString };
};

export const generateAuraVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  try {
    const response = await fetch("/api/gemini/video", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, aspectRatio }),
    });
    const data = await response.json();
    return data.url;
  } catch (e) {
    console.error("Aura Video Error", e);
    return null;
  }
};

export const generateAuraSpeech = async (text: string) => {
  try {
    const response = await fetch("/api/gemini/speech", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    return data.audio;
  } catch (e) {
    console.error("Aura Speech Error", e);
    return null;
  }
};

export type ImageResult = { image: string | null; error: string | null; code: string | null };

export const generateTryOnTransformation = async (userImg: string, productImg: string, category?: string): Promise<ImageResult> => {
  try {
    const response = await fetch("/api/gemini/try-on", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userImg, productImg, category }),
    });
    const data = await response.json();
    // Server returns a ready-to-use image (ModelsLab URL or Gemini data-URL) — use as-is.
    if (data.image) return { image: data.image, error: null, code: null };
    return { image: null, error: data.message || 'Aura Vision is busy — please try again.', code: data.error || 'busy' };
  } catch (e) {
    console.error("Aura Try-On Error", e);
    return { image: null, error: 'Neural link interrupted — please try again.', code: 'network' };
  }
};

export const generateAuraImage = async (prompt: string, referenceImage?: string) => {
  try {
    const response = await fetch("/api/gemini/generate-image", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, referenceImage }),
    });
    const data = await response.json();
    return data.image ? `data:image/png;base64,${data.image}` : null;
  } catch (e) {
    console.error("Aura Image Error", e);
    return null;
  }
};

export const generateAuraProImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K') => {
  try {
    const response = await fetch("/api/gemini/pro-image", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, size }),
    });
    const data = await response.json();
    return data.image ? `data:image/png;base64,${data.image}` : null;
  } catch (e) {
    console.error("Aura Pro Image Error", e);
    return null;
  }
};

export const generateStyleTransfer = async (image: string, style: string): Promise<ImageResult> => {
  try {
    const response = await fetch("/api/gemini/style-transfer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, style }),
    });
    const data = await response.json();
    if (data.image) return { image: data.image, error: null, code: null };
    return { image: null, error: data.message || 'Aura Vision is busy — please try again.', code: data.error || 'busy' };
  } catch (e) {
    console.error("Aura Style Transfer Error", e);
    return { image: null, error: 'Neural link interrupted — please try again.', code: 'network' };
  }
};

export const editAuraImage = async (instruction: string, imageBase64: string) => {
  return generateStyleTransfer(imageBase64, instruction);
};

export const searchGroundedAura = async (query: string) => {
  try {
    const response = await fetch("/api/gemini/search-grounded", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    return await response.json();
  } catch (e) {
    return null;
  }
};

export const mapsGroundedAura = async (query: string, lat?: number, lng?: number) => {
  try {
    const response = await fetch("/api/gemini/maps-grounded", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, lat, lng }),
    });
    return await response.json();
  } catch (e) {
    return null;
  }
};

export const complexThinkingAura = async (prompt: string) => {
  try {
    const response = await fetch("/api/gemini/thinking", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    return data.text;
  } catch (e) {
    return "Thinking process failed.";
  }
};

export const generateStyleSuggestion = async (productName: string, category: string): Promise<string> => {
  return `Experience the elegance of ${productName} in this ${category} style.`;
};

let chatHistory: any[] = [];

export const generateAuraResponse = async (message: string): Promise<string> => {
  try {
    const { productString, vendorString } = buildAuraStrings();
    const response = await fetch("/api/gemini/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message, 
        history: chatHistory, 
        inventory: productString, 
        vendors: vendorString 
      }),
    });
    const data = await response.json();
    if (data.text) {
      chatHistory.push({ role: "user", parts: [{ text: message }] });
      chatHistory.push({ role: "model", parts: [{ text: data.text }] });
    }
    return data.text || "Aura Neural Link is unstable.";
  } catch (error) {
    console.error("Aura Chat Error:", error);
    return "Connection to Neural Grid failed.";
  }
};

export const resetAuraChat = () => {
  chatHistory = [];
};

export const getAIRecommendations = async (historyProducts: Product[]): Promise<number[]> => {
  try {
    const historySummary = historyProducts.map(p => `ID: ${p.id} (${p.name}, ${p.category})`).join(', ');
    const availableProducts = getProducts().map(p => `ID: ${p.id} (${p.name}, ${p.category})`).join('\n');
    
    const response = await fetch("/api/gemini/recommendations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ historySummary, availableProducts }),
    });
    const result = await response.json();
    const cartIds = historyProducts.map(p => p.id);
    return (result.recommendedIds || []).filter((id: number) => !cartIds.includes(id));
  } catch (e) {
    return [];
  }
};

export const analyzeSearchIntent = async (userPrompt: string): Promise<SearchIntent | null> => {
  try {
    const response = await fetch("/api/gemini/search-intent", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userPrompt }),
    });
    return await response.json();
  } catch (e) {
    return null;
  }
};

export const analyzeWebsiteProducts = async (htmlContent: string) => {
  try {
    const response = await fetch("/api/gemini/analyze-web", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: htmlContent }),
    });
    const data = await response.json();
    return data.products || [];
  } catch (e) {
    return [];
  }
};

export const auditVendorDescription = async (shopName: string, description: string, tradeLicense: string) => {
  try {
    const response = await fetch("/api/gemini/audit-vendor", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopName, description, tradeLicense }),
    });
    return await response.json();
  } catch (e) {
    return { status: "REJECTED", reason: "Audit service unavailable." };
  }
};

export const generateStyleTransferFromImage = async (originImage: string, styleInstruction: string) => {
  return generateStyleTransfer(originImage, styleInstruction);
};
