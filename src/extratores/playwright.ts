import { chromium } from 'playwright';

export async function extrairComPlaywright(url: string): Promise<string | null> {
    let browser = null;
    try {
        console.log('🔄 Iniciando Playwright para:', url);

        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport: { width: 1280, height: 720 }
        });

        const page = await context.newPage();

        // Capturar requisições de rede
        const m3u8Requests: string[] = [];
        page.on('request', (req) => {
            const url = req.url();
            if (url.includes('.m3u8')) {
                m3u8Requests.push(url);
                console.log('🔍 Playwright capturou .m3u8:', url);
            }
        });

        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // 1. Verificar se capturou .m3u8 nas requisições
        if (m3u8Requests.length > 0) {
            console.log('✅ Playwright encontrou .m3u8:', m3u8Requests[0]);
            return m3u8Requests[0];
        }

        // 2. Extrair do DOM
        const m3u8Link = await page.evaluate(() => {
            // Procurar em video sources
            const sources = document.querySelectorAll('video source');
            for (const source of sources) {
                const src = source.getAttribute('src');
                if (src && src.includes('.m3u8')) return src;
            }
            // Procurar no HTML
            const html = document.documentElement.innerHTML;
            const match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
            if (match) return match[0];
            return null;
        });

        if (m3u8Link) {
            console.log('✅ Playwright encontrou .m3u8 no DOM:', m3u8Link);
            return m3u8Link;
        }

        console.log('❌ Playwright não encontrou .m3u8');
        return null;

    } catch (error: any) {
        console.error('❌ Playwright erro:', error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}
