import { json } from '@sveltejs/kit';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const POST = async ({ request }) => {
  const { url } = await request.json();

  if (!url) {
    return json({ error: "URL is required" }, { status: 400 });
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

    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('iframe').remove();
    $('svg').remove();

    const title = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const bodyContent = $('body').html();

    return json({
      url,
      title,
      description: metaDescription,
      content: bodyContent?.substring(0, 50000)
    });
  } catch (error: any) {
    console.error(`[Scraper Error]: ${error.message}`);
    return json({ 
      error: "Failed to fetch website content", 
      details: error.message 
    }, { status: 500 });
  }
};
