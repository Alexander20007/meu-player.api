import * as cheerio from "cheerio";

const SUPABASE_URL = 'https://dpdxceorevfudhnrmulo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7Ccv9D3N097xwrqjuJQ7CA_kiFWbxH6';

interface StreamResult {
  name: string | null;
  image: string | null;
  mediaId: string | null;
  stream: string | null;
  referer: string;
  isM3U8: boolean;
}

let provedoresCache: any[] | null = null;
let ultimaAtualizacao = 0;
const TEMPO_CACHE = 60000;

async function buscarProvedores(): Promise<any[]> {
    if (provedoresCache && (Date.now() - ultimaAtualizacao) < TEMPO_CACHE) {
        return provedoresCache;
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/provedores?select=*&ativo=eq.true&order=ordem.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            console.error('❌ Erro ao buscar provedores:', response.status);
            return [];
        }

        const data = await response.json();
        console.log(`📡 ${data.length} provedores carregados do Supabase`);
        provedoresCache = data;
        ultimaAtualizacao = Date.now();
        return data;

    } catch (error) {
        console.error('❌ Erro ao conectar ao Supabase:', error);
        return provedoresCache || [];
    }
}

async function tmdbScrape(tmdbId: string, type: "movie" | "tv", season?: number, episode?: number): Promise<StreamResult[]> {
    try {
        const results: StreamResult[] = [];
        
        const provedores = await buscarProvedores();
        
        if (provedores.length === 0) {
            console.log('⚠️ Nenhum provedor encontrado no Supabase');
            return [];
        }

        const tipoBusca = type === 'movie' ? 'Filmes' : 'Séries';
        const provedoresFiltrados = provedores.filter(p => p.nome.includes(tipoBusca));

        if (provedoresFiltrados.length === 0) {
            console.log(`⚠️ Nenhum provedor para ${tipoBusca}`);
            return [];
        }

        console.log(`🔍 Tentando ${provedoresFiltrados.length} provedores para ${tipoBusca}`);

        for (const provider of provedoresFiltrados) {
            try {
                let urlProvedor = provider.url_template
                    .replace(/\{id\}/g, tmdbId)
                    .replace(/\{type\}/g, type);

                if (type === 'tv' && season && episode) {
                    urlProvedor += `&season=${season}&episode=${episode}`;
                }

                console.log(`🔍 Tentando: ${provider.nome}`);

                const response = await fetch(urlProvedor, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': provider.referer || 'https://google.com'
                    }
                });

                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);
                    
                    let m3u8Link = null;
                    
                    $('video source').each((i, el) => {
                        const src = $(el).attr('src');
                        if (src && src.includes('.m3u8')) {
                            m3u8Link = src;
                        }
                    });
                    
                    if (!m3u8Link) {
                        const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
                        if (m3u8Match) {
                            m3u8Link = m3u8Match[0];
                        }
                    }
                    
                    if (m3u8Link) {
                        results.push({
                            name: provider.nome + " (M3U8)",
                            image: null,
                            mediaId: tmdbId,
                            stream: m3u8Link,
                            referer: provider.referer,
                            isM3U8: true
                        });
                        console.log(`✅ ${provider.nome} - Link .m3u8 encontrado!`);
                        continue;
                    }
                    
                    const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
                    if (iframeMatch) {
                        let stream = iframeMatch[1];
                        if (stream.startsWith('//')) stream = 'https:' + stream;
                        
                        results.push({
                            name: provider.nome + " (Iframe)",
                            image: null,
                            mediaId: tmdbId,
                            stream: stream,
                            referer: provider.referer,
                            isM3U8: false
                        });
                        console.log(`✅ ${provider.nome} - Iframe encontrado`);
                    }
                }
            } catch (error) {
                console.log(`❌ ${provider.nome} falhou:`, error.message);
            }
        }

        return results;

    } catch (error: any) {
        console.error("❌ Erro:", error.message);
        return [];
    }
}

export default tmdbScrape;
