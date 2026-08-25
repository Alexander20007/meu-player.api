// ============================================
// API DE FILMES/SÉRIES - CHAMA EDGE FUNCTION DO SUPABASE
// ============================================

import * as cheerio from "cheerio";

// URL da Edge Function do Supabase
const EDGE_FUNCTION_URL = 'https://dpdxceorevfudhnrmulo.supabase.co/functions/v1/api-proxy';

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
        // Monta a URL da Edge Function
        let url = `${EDGE_FUNCTION_URL}?tmdbId=${tmdbId}&type=${type}`;
        
        // Se for série, adiciona season e episode
        if (type === 'tv' && season && episode) {
            url += `&season=${season}&episode=${episode}`;
        }

        console.log(`📤 Chamando Edge Function: ${url}`);

        const response = await fetch(url);
        const data = await response.json();

        console.log(`📥 Resposta da Edge Function: ${JSON.stringify(data)}`);

        // A Edge Function já retorna no formato que precisamos
        return data;

    } catch (error: any) {
        console.error("❌ Erro:", error.message);
        return [];
    }
}

export default tmdbScrape;
