import * as cheerio from "cheerio";

interface StreamResult {
  name: string | null;
  image: string | null;
  mediaId: string | null;
  stream: string | null;
  referer: string;
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
        name: "VidSrc (Net)",
        url: (type === "movie") 
          ? `https://vidsrc.net/embed/movie?tmdb=${tmdbId}`
          : `https://vidsrc.net/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
        referer: "https://vidsrc.net"
      },
      {
        name: "Embed.su",
        url: (type === "movie")
          ? `https://embed.su/embed/movie/${tmdbId}`
          : `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
        referer: "https://embed.su"
      }
    ];

    // Tentar cada provedor
    for (const provider of providers) {
      try {
        console.log(`🔍 Tentando: ${provider.name}`);
        
        const response = await fetch(provider.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Extrair link
          const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
          const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
          
          let stream = null;
          if (iframeMatch) stream = iframeMatch[1];
          else if (videoMatch) stream = videoMatch[1];
          else if (m3u8Match) stream = m3u8Match[0];
          
          if (stream) {
            // Se o stream for relativo, completar a URL
            if (stream.startsWith('//')) {
              stream = 'https:' + stream;
            } else if (stream.startsWith('/')) {
              stream = provider.referer + stream;
            }
            
            results.push({
              name: provider.name,
              image: null,
              mediaId: tmdbId,
              stream: stream,
              referer: provider.referer
            });
            console.log(`✅ ${provider.name} funcionou!`);
          }
        }
      } catch (error) {
        console.log(`❌ ${provider.name} falhou`);
      }
    }

    if (results.length === 0) {
      console.log("⚠️ Nenhum provedor funcionou");
    }
    
    return results;
    
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    return [];
  }
}

export default tmdbScrape;
