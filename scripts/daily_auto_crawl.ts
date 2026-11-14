const CONFIG = {
  host: process.env.SITE_HOST || 'fashiondoniyabd.com',
  baseUrl: (process.env.SITE_URL || 'https://fashiondoniyabd.com').replace(/\/$/, ''),
  sitemapUrl: `${(process.env.SITE_URL || 'https://fashiondoniyabd.com').replace(/\/$/, '')}/sitemap.xml`,
  indexNowKey: process.env.INDEXNOW_KEY || 'fashion-doniya-indexnow-key-2026',
  concurrency: 8,
};

async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  const resp = await fetch(sitemapUrl);
  if (!resp.ok) {
    throw new Error(`Failed to fetch sitemap (${resp.status}): ${sitemapUrl}`);
  }
  const xml = await resp.text();
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches.map((m) => m[1].trim()).filter(Boolean);
}

async function warmUrls(urls: string[], concurrency: number): Promise<void> {
  let index = 0;
  async function worker() {
    while (index < urls.length) {
      const current = urls[index++];
      try {
        const res = await fetch(current, { headers: { 'User-Agent': 'FashionDoniya-AutoCrawl/1.0' } });
        console.log(`[Warm ${res.status}] ${current}`);
      } catch (err) {
        console.warn(`[Warm Error] ${current}:`, err);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length || 1) }, worker));
}

async function submitIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  const resp = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: CONFIG.host,
      key: CONFIG.indexNowKey,
      keyLocation: `${CONFIG.baseUrl}/${CONFIG.indexNowKey}.txt`,
      urlList: urls,
    }),
  });
  console.log(`[IndexNow] Status: ${resp.status}`);
}

async function main() {
  console.log(`Starting daily auto-crawl for ${CONFIG.sitemapUrl}`);
  const urls = await fetchSitemapUrls(CONFIG.sitemapUrl);
  console.log(`Discovered ${urls.length} URLs in sitemap.xml`);
  await warmUrls(urls, CONFIG.concurrency);
  await submitIndexNow(urls);
}

main().catch((err) => {
  console.error('Daily auto-crawl failed:', err);
  process.exit(1);
});
