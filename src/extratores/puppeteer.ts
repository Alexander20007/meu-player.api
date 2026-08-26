import puppeteer from 'puppeteer';

export async function extrairComPuppeteer(url: string): Promise<string | null> {
    let browser = null;
    try {
        console.log('🔄 Iniciando Puppeteer para:', url);

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // 1. Tentar encontrar .m3u8 no HTML
        let m3u8Link = await page.evaluate(() => {
            // Procurar em sources de video
            const sources = document.querySelectorAll('video source');
            for (const source of sources) {
                const src = source.getAttribute('src');
                if (src && src.includes('.m3u8')) return src;
            }
            // Procurar em iframes
            const iframes = document.querySelectorAll('iframe');
            for (const iframe of iframes) {
                const src = iframe.getAttribute('src');
                if (src && src.includes('.m3u8')) return src;
            }
            // Procurar no HTML todo
            const html = document.documentElement.innerHTML;
            const match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
            if (match) return match[0];
            return null;
        });

        if (m3u8Link) {
            console.log('✅ Puppeteer encontrou .m3u8:', m3u8Link);
            return m3u8Link;
        }

        // 2. Se não achou, tentar extrair de requisições de rede
        const requests: string[] = [];
        page.on('request', (req) => {
            const url = req.url();
            if (url.includes('.m3u8')) {
                requests.push(url);
            }
        });

        // Recarregar para capturar requisições
        await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });

        if (requests.length > 0) {
            console.log('✅ Puppeteer encontrou .m3u8 nas requisições:', requests[0]);
            return requests[0];
        }

        console.log('❌ Puppeteer não encontrou .m3u8');
        return null;

    } catch (error: any) {
        console.error('❌ Puppeteer erro:', error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}
