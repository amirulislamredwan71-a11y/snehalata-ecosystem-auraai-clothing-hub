import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import path from "path";
import * as gemini from "./lib/gemini.server";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Gemini Proxy Routes
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history, inventory, vendors } = req.body;
      const response = await gemini.generateAuraResponse(message, history || [], inventory, vendors);
      res.json({ text: response });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/recommendations", async (req, res) => {
    try {
      const { historySummary, availableProducts } = req.body;
      const data = await gemini.getAIRecommendations(historySummary, availableProducts);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/search-intent", async (req, res) => {
    try {
      const { prompt } = req.body;
      const data = await gemini.analyzeSearchIntent(prompt);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/try-on", async (req, res) => {
    try {
      const { userImg, productImg } = req.body;
      const data = await gemini.generateTryOnTransformation(userImg, productImg);
      res.json({ image: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/speech", async (req, res) => {
    try {
      const { text } = req.body;
      const data = await gemini.generateAuraSpeech(text);
      res.json({ audio: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/generate-image", async (req, res) => {
    try {
      const { prompt, referenceImage } = req.body;
      const data = await gemini.generateAuraImage(prompt, referenceImage);
      res.json({ image: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/video", async (req, res) => {
    try {
      const { prompt, aspectRatio } = req.body;
      const uri = await gemini.generateAuraVideo(prompt, aspectRatio);
      res.json({ url: uri });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/pro-image", async (req, res) => {
    try {
      const { prompt, size } = req.body;
      const data = await gemini.generateAuraProImage(prompt, size);
      res.json({ image: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/search-grounded", async (req, res) => {
    try {
      const { query } = req.body;
      const data = await gemini.searchGroundedAura(query);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/maps-grounded", async (req, res) => {
    try {
      const { query, lat, lng } = req.body;
      const data = await gemini.mapsGroundedAura(query, lat, lng);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/thinking", async (req, res) => {
    try {
      const { prompt } = req.body;
      const text = await gemini.complexThinkingAura(prompt);
      res.json({ text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/style-transfer", async (req, res) => {
    try {
      const { image, style } = req.body;
      const data = await gemini.generateStyleTransfer(image, style);
      res.json({ image: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/audit-vendor", async (req, res) => {
    try {
      const { shopName, description, tradeLicense } = req.body;
      const data = await gemini.auditVendorDescription(shopName, description, tradeLicense);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/analyze-web", async (req, res) => {
    try {
      const { html } = req.body;
      const data = await gemini.analyzeWebsiteProducts(html);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Neural Scraping Proxy
   * Fetches raw HTML from a target URL to be analyzed by Gemini on the frontend.
   */
  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    try {
        console.log(`[Scraper] Analyzing Target: ${url}`);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
            timeout: 10000
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Remove script and style tags to minimize payload size for Gemini
        $('script').remove();
        $('style').remove();
        $('noscript').remove();
        $('iframe').remove();
        $('svg').remove();

        // Extract meaningful text and metadata
        const title = $('title').text();
        const metaDescription = $('meta[name="description"]').attr('content') || '';
        
        // Return a simplified version of the body to Gemini
        const bodyContent = $('body').html();

        res.json({
            url,
            title,
            description: metaDescription,
            content: bodyContent?.substring(0, 50000) // Limit size for initial extraction
        });
    } catch (error: any) {
        console.error(`[Scraper Error]: ${error.message}`);
        res.status(500).json({ 
            error: "Failed to fetch website content", 
            details: error.message 
        });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Aura Engine] Neural Core running on http://localhost:${PORT}`);
    console.log(`[Aura Engine] Backend Proxy active for real-time scraping.`);
  });
}

startServer();
