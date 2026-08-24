import * as cheerio from "cheerio";

interface StreamResult {
  name: string | null;
  image: string | null;
  mediaId: string | null;
  stream: string | null;
  referer: string;
  isM3U8: boolean;
}

async function tmdbScrape(tmdbId: string, type: "movie" | "tv", season?: number, episode?: number): Promise<StreamResult[]> {
  try {
    const results: StreamResult[] = [];
    
    const providers = [
      {
        name: "VidSrc (To)",
        url: (type === "movie") 
          ? `https://vidsrc.to/embed/movie/${tmdbId}`
          : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
        referer: "https://vidsrc.to"
      },
      {
        name: "2Embed",
        url: (type === "movie")
          ? `https://www.2embed.cc/embed/${tmdbId}`
          : `https://www.2embed.cc/embed/${tmdbId}?season=${season}&episode=${episode}`,
        referer: "https://www.2embed.cc"
      },
      {
        name: "VidEmbed",
        url: (type === "movie")
          ? `https://vidembed.cc/embed/${tmdbId}`
          : `https://vidembed.cc/embed/${tmdbId}?season=${season}&episode=${episode}`,
        referer: "https://vidembed.cc"
      },
      {
        name: "Embed.su",
        url: (type === "movie")
          ? `https://embed.su/embed/movie/${tmdbId}`
          : `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
        referer: "https://embed.su"
      },
      // ===== NOVOS PROVEDORES =====
      {
        name: "MyEmbed",
        url: (type === "movie")
          ? `https://myembed.biz/embed/${tmdbId}`
          : `https://myembed.biz/embed/${tmdbId}?season=${season}&episode=${episode}`,
        referer: "https://myembed.biz"
      },
      {
        name: "VidLink",
        url: (type === "movie")
          ? `https://vidlink.pro/movie/${tmdbId}`
          : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`,
        referer: "https://vidlink.pro"
      }
    ];

    for (const provider of providers) {
      try {
        console.log(`🔍 Tentando: ${provider.name}`);
        
        const response = await fetch(provider.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': provider.referer
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);
          
          // 1. PROCURAR LINK .M3U8 DIRETO (melhor opção)
          let m3u8Link = null;
          
          // Buscar em sources do video
          $('video source').each((i, el) => {
            const src = $(el).attr('src');
            if (src && src.includes('.m3u8')) {
              m3u8Link = src;
            }
          });
          
          // Buscar no HTML todo
          if (!m3u8Link) {
            const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
            if (m3u8Match) {
              m3u8Link = m3u8Match[0];
            }
          }
          
          if (m3u8Link) {
            results.push({
              name: provider.name + " (M3U8)",
              image: null,
              mediaId: tmdbId,
              stream: m3u8Link,
              referer: provider.referer,
              isM3U8: true
            });
            console.log(`✅ ${provider.name} - Link .m3u8 encontrado!`);
            continue;
          }
          
          // 2. SE NÃO ACHOU .M3U8, PEGA O IFRAME
          const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          if (iframeMatch) {
            let stream = iframeMatch[1];
            if (stream.startsWith('//')) stream = 'https:' + stream;
            
            results.push({
              name: provider.name + " (Iframe)",
              image: null,
              mediaId: tmdbId,
              stream: stream,
              referer: provider.referer,
              isM3U8: false
            });
            console.log(`✅ ${provider.name} - Iframe encontrado`);
          }
        }
      } catch (error) {
        console.log(`❌ ${provider.name} falhou`);
      }
    }

    return results;
    
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    return [];
  }
}

export default tmdbScrape;
