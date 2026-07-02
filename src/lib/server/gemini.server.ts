import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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

export const generateTryOnTransformation = async (userImg: string, productImg: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: userImg.split(',')[1], mimeType: 'image/jpeg' } },
                { inlineData: { data: productImg.split(',')[1], mimeType: 'image/jpeg' } },
                { text: "Overlay this garment onto the person naturally." }
            ]
        }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return part.inlineData.data;
    }
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
    const response = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash-image', 
      contents: { parts } 
    });
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
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
                { text: `Re-imagine this image in the style of: ${styleInstruction}. Maintain the core composition but shift the artistic medium and visual grammar.` }
            ]
        }
    });
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

// A6 — governance: moderate a product listing before it goes live.
export const moderateListing = async (name: string, description: string, price: number, category: string) => {
    const response = await ai.models.generateContent({
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
    });
    return JSON.parse(response.text || '{"trust_score":50,"verdict":"APPROVE","note":"auto-approved"}');
};

// A4 — vendor AI merchandising: one product photo → a ready-to-edit catalog listing.
export const analyzeProductImage = async (base64Image: string) => {
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const response = await ai.models.generateContent({
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
    });
    return JSON.parse(response.text || 'null');
};
