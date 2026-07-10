import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Gemini preview models 503 ("high demand / UNAVAILABLE") under load. Retry those
// transient failures with a short backoff before giving up. Non-transient errors
// (bad request, auth) throw immediately.
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || e).toLowerCase();
      const transient =
        msg.includes('503') || msg.includes('unavailable') || msg.includes('overloaded') ||
        msg.includes('high demand') || msg.includes('429') || msg.includes('resource_exhausted') ||
        msg.includes('rate limit') || msg.includes('500') || msg.includes('internal');
      if (!transient || i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr;
}

const buildAuraContext = (inventory: string, vendors: string) => {
  return `IDENTITY: You are Aura AI (স্নেহলতা ইকোসিস্টেম গাইড).
  TONE: Elegant, futuristic, warm, and helpful. Always maintain a sophisticated "Neural Guardian" persona.
  LANGUAGE: Respond in the language the user initiates (Bengali or English).
  GREETING: Start the first interaction with "আসসালামু আলাইকুম" or "Greetings from the Grid".

  ECOSYSTEM DATA:
  
  VENDORS:
  ${vendors}

  INVENTORY:
  ${inventory}

  RULES:
  1. When recommending products, explicitly mention their ID and Price.
  2. If a vendor is BLOCKED or PENDING, warn the user if they ask about them.
  3. Keep responses concise unless asked for a detailed story.
  4. You can perform "Visual Try-On" if the user uploads a photo (simulation).
  `;
};

export const generateAuraResponse = async (message: string, history: any[], inventory: string, vendors: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction: buildAuraContext(inventory, vendors), temperature: 0.7 },
    history: history
  });
  const result = await chat.sendMessage({ message });
  return result.text;
};

// A5 — conversational commerce: Aura chat that can call real tools (grounded in
// live data). The endpoint supplies `execTool` so this module stays free of DB deps.
const AURA_TOOLS = {
  functionDeclarations: [
    {
      name: 'search_catalog',
      description: 'Search the live SNEHALATA product catalog. Call this whenever the user wants to find, see, browse or buy products.',
      parameters: {
        type: Type.OBJECT,
        properties: { query: { type: Type.STRING, description: 'keywords or category, e.g. "red silk saree" or "panjabi"' } },
        required: ['query']
      }
    },
    {
      name: 'get_order_status',
      description: 'Look up the current fulfillment status of an order by its numeric order ID.',
      parameters: {
        type: Type.OBJECT,
        properties: { order_id: { type: Type.STRING, description: 'the order id, e.g. 5001' } },
        required: ['order_id']
      }
    }
  ]
};

export const generateAuraResponseWithTools = async (
  message: string,
  history: any[],
  inventory: string,
  vendors: string,
  execTool: (name: string, args: any) => Promise<any>
) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction: buildAuraContext(inventory, vendors), temperature: 0.7, tools: [AURA_TOOLS] },
    history: history || []
  });

  let res = await withRetry(() => chat.sendMessage({ message }));
  // Resolve up to 3 rounds of tool calls, feeding real results back to the model.
  for (let i = 0; i < 3; i++) {
    const calls = res.functionCalls;
    if (!calls || !calls.length) break;
    const parts: any[] = [];
    for (const call of calls) {
      let result: any;
      try {
        result = await execTool(call.name as string, call.args || {});
      } catch (e: any) {
        result = { error: e?.message || 'tool failed' };
      }
      parts.push({ functionResponse: { name: call.name, response: { result } } });
    }
    res = await withRetry(() => chat.sendMessage({ message: parts }));
  }
  return res.text;
};

// Plain, no-tools fallback on the stable model — used when tool-calling 503s.
export const generateAuraFallback = async (message: string, inventory: string, vendors: string) => {
  const response = await withRetry(() => ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: message,
    config: { systemInstruction: buildAuraContext(inventory, vendors), temperature: 0.7 }
  }));
  return response.text;
};

export const getAIRecommendations = async (historySummary: string, availableProducts: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `User current cart items: [${historySummary}]. Based on these, recommend exactly 3 other products from this list: \n${availableProducts}. Return their numeric IDs as JSON.`,
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    recommendedIds: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                },
                required: ['recommendedIds']
            }
        }
    });
    return JSON.parse(response.text || '{"recommendedIds": []}');
};

export const analyzeSearchIntent = async (userPrompt: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Analyze search query: "${userPrompt}". Extract category, maxPrice, material (e.g., cotton, silk), color, style (e.g., Vintage, Modern, Traditional, Cyberpunk, Boho), and semanticKeywords.`,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              maxPrice: { type: Type.NUMBER },
              material: { type: Type.STRING },
              color: { type: Type.STRING },
              style: { type: Type.STRING },
              semanticKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
    });
    return JSON.parse(response.text || 'null');
};

// Turn ANY image reference into Gemini inlineData {data(base64), mimeType}. Handles a
// data: URL (split), an http(s) URL, or a site-relative "/path" (fetched server-side,
// prefixed with the site origin — mirrors toPublicUrl in modelslab.server.ts). This is
// the fix for try-on: /studio & catalog products pass a URL, not base64.
const SITE_ORIGIN = 'https://www.snehalata.com';
async function imageToInline(ref: string): Promise<{ data: string; mimeType: string }> {
    if (!ref) throw new Error('empty image reference');
    const m = ref.match(/^data:(image\/[\w+.-]+);base64,(.+)$/s);
    if (m) return { data: m[2], mimeType: m[1] };
    const url = /^https?:\/\//i.test(ref) ? ref : SITE_ORIGIN + (ref.startsWith('/') ? ref : '/' + ref);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`could not fetch image (${resp.status})`);
    const ct = (resp.headers.get('content-type') || '').split(';')[0].trim();
    const buf = Buffer.from(await resp.arrayBuffer());
    return { data: buf.toString('base64'), mimeType: ct.startsWith('image/') ? ct : 'image/jpeg' };
}

export const generateTryOnTransformation = async (userImg: string, productImg: string) => {
    const [person, garment] = await Promise.all([imageToInline(userImg), imageToInline(productImg)]);
    const parts = [
        { inlineData: { data: person.data, mimeType: person.mimeType } },
        { inlineData: { data: garment.data, mimeType: garment.mimeType } },
        { text: "Photorealistic virtual try-on. Take the PERSON in the FIRST image and dress them in the GARMENT shown in the SECOND image. Keep the person's face, hairstyle, body shape, skin tone, pose and background EXACTLY the same — change ONLY their clothing to the garment, fitted naturally with realistic folds, drape, lighting and shadows. Output a single clean full-body photo. Return ONLY the edited image, no text." }
    ];
    // gemini-3.1 image preview composites two images better; fall back to 2.5 if unavailable.
    const models = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];
    let lastErr: any = null;
    for (const model of models) {
        try {
            const response = await withRetry(() => ai.models.generateContent({
                model,
                contents: { parts },
                config: { responseModalities: [Modality.IMAGE] }
            }));
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) return part.inlineData.data;
            }
            // model returned no image (e.g. text refusal) — try the next model
        } catch (e: any) {
            lastErr = e;
            // A genuine quota/billing error must bubble up so the endpoint can be honest.
            if (/RESOURCE_EXHAUSTED|429|quota|billing|limit:\s*0/i.test(String(e?.message || ''))) throw e;
            // otherwise try the next model
        }
    }
    if (lastErr) console.error('[try-on] both image models failed:', lastErr?.message || lastErr);
    return null;
};

export const generateAuraSpeech = async (text: string) => {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Speak elegantly in Bengali/English: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const analyzeWebsiteProducts = async (htmlContent: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following webpage content and extract a list of products. For each product, find: name, price (convert to BDT numbers if possible), image URL (if present), and a confidence score (0-100) based on how sure you are it's a product.
        
        CONTENT:
        ${htmlContent.substring(0, 30000)}`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    products: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                price: { type: Type.NUMBER },
                                confidence: { type: Type.NUMBER },
                                imageUrl: { type: Type.STRING },
                                description: { type: Type.STRING }
                            },
                            required: ['name', 'price', 'confidence']
                        }
                    }
                },
                required: ['products']
            }
        }
    });
    return JSON.parse(response.text || '{"products": []}');
};

export const generateAuraImage = async (prompt: string, referenceImageBase64?: string) => {
    const parts: any[] = [{ text: prompt }];
    if (referenceImageBase64) {
      parts.unshift({ 
        inlineData: { 
          data: referenceImageBase64.split(',')[1], 
          mimeType: 'image/png' 
        } 
      });
    }
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { responseModalities: [Modality.IMAGE] }
    }));
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return part.inlineData.data;
    }
    return null;
};

export const generateAuraVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt,
      config: { numberOfVideos: 1, resolution: '1080p', aspectRatio }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    return operation.response?.generatedVideos?.[0]?.video?.uri;
};

export const generateAuraProImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K') => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1", imageSize: size } },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return part.inlineData.data;
    }
    return null;
};

export const searchGroundedAura = async (query: string) => {
    const response = await ai.models.generateContent({
       model: "gemini-3-flash-preview",
       contents: query,
       config: { tools: [{ googleSearch: {} }] },
    });
    return {
        text: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
};

export const mapsGroundedAura = async (query: string, lat?: number, lng?: number) => {
    const config: any = { tools: [{ googleMaps: {} }] };
    if (lat && lng) config.toolConfig = { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } };
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config,
    });
    return {
        text: response.text || "",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
};

export const complexThinkingAura = async (prompt: string) => {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {},
    });
    return response.text || "";
};

export const generateStyleTransfer = async (base64Image: string, styleInstruction: string) => {
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
                { text: `Re-imagine this image in the style of: ${styleInstruction}. Maintain the core composition but shift the artistic medium and visual grammar. Return only the edited image.` }
            ]
        },
        config: { responseModalities: [Modality.IMAGE] }
    }));
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return part.inlineData.data;
    }
    return null;
};

export const auditVendorDescription = async (shopName: string, description: string, tradeLicense: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Audit vendor application: 
        Name: ${shopName}
        Description: ${description}
        License: ${tradeLicense}
        
        Is this a legitimate artisan/heritage brand based on the description? 
        Reject if it contains offensive content or seems like a scam. 
        Return status (SUCCESS/REJECTED) and a short reason in Bengali/English.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    status: { type: Type.STRING, enum: ['SUCCESS', 'REJECTED'] },
                    reason: { type: Type.STRING }
                },
                required: ['status', 'reason']
            }
        }
    });
    return JSON.parse(response.text || '{"status": "REJECTED", "reason": "Audit failed"}');
};

// A3 — semantic search: embed text into a 768-d vector (text-embedding-004).
export const embedText = async (text: string): Promise<number[] | null> => {
    try {
        const res: any = await withRetry(() => ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: text,
            config: { outputDimensionality: 768 }
        }));
        const vals = res?.embeddings?.[0]?.values || res?.embedding?.values;
        return Array.isArray(vals) && vals.length ? vals : null;
    } catch (e: any) {
        console.error('EMBED ERROR:', e?.message || e);
        return null;
    }
};

// A3 — visual search: turn an uploaded photo into a searchable text description,
// which we then embed into the same vector space as the catalog.
export const captionImage = async (base64Image: string): Promise<string> => {
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const r = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data, mimeType: 'image/jpeg' } },
                { text: 'Describe this clothing item in 15-25 words for a shopping search: garment type, fabric, colour, pattern and style. Output only the description text.' }
            ]
        }
    }));
    return (r.text || '').trim();
};

// A6 — governance: moderate a product listing before it goes live.
export const moderateListing = async (name: string, description: string, price: number, category: string) => {
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Moderate this listing for SNEHALATA, a premium Bangladeshi heritage clothing marketplace.
Name: ${name}
Category: ${category}
Price (BDT): ${price}
Description: ${description}

Flag counterfeit / fake-branded claims, offensive or illegal content, obvious spam/gibberish, or wildly unrealistic pricing.
Return trust_score 0-100 (100 = clearly authentic & appropriate), verdict (APPROVE if trust_score>=50, else REVIEW), and a one-line note (Bengali or English).`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    trust_score: { type: Type.NUMBER },
                    verdict: { type: Type.STRING, enum: ['APPROVE', 'REVIEW'] },
                    note: { type: Type.STRING }
                },
                required: ['trust_score', 'verdict', 'note']
            }
        }
    }));
    return JSON.parse(response.text || '{"trust_score":50,"verdict":"APPROVE","note":"auto-approved"}');
};

// A4 — vendor AI merchandising: one product photo → a ready-to-edit catalog listing.
export const analyzeProductImage = async (base64Image: string) => {
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data, mimeType: 'image/jpeg' } },
                { text: `You are Aura's merchandising AI for SNEHALATA, a premium Bangladeshi heritage clothing marketplace (Jamdani, Muslin, Nakshi Kantha, silk, panjabi, modern fusion, etc.). Look at this product photo and produce a catalog listing:
- title: concise, appealing English product title (max 8 words)
- description_en: 2-3 sentences highlighting fabric, craft and styling
- description_bn: the same idea in natural, elegant Bengali
- category: EXACTLY one of Saree, Panjabi, Three-Piece, T-Shirt, Pant, Baby, Others
- tags: 4-6 short lowercase tags
- suggested_price_bdt: a realistic BDT retail price (number only)
- quality_score: 0-100, how clear/professional this photo is as a listing image
- authenticity_note: one short line on the heritage/authenticity signal you observe` }
            ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description_en: { type: Type.STRING },
                    description_bn: { type: Type.STRING },
                    category: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggested_price_bdt: { type: Type.NUMBER },
                    quality_score: { type: Type.NUMBER },
                    authenticity_note: { type: Type.STRING }
                },
                required: ['title', 'description_en', 'category', 'suggested_price_bdt', 'quality_score']
            }
        }
    }));
    return JSON.parse(response.text || 'null');
};
