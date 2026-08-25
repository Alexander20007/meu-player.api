const SUPABASE_URL = 'https://dpdxceorevfudhnrmulo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7Ccv9D3N097xwrqjuJQ7CA_kiFWbxH6';

let canaisCache: any[] | null = null;
let ultimaAtualizacao = 0;
const TEMPO_CACHE = 60000;

async function buscarUrlLista(): Promise<string | null> {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/config?chave=eq.canais_url&select=valor`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            console.error('❌ Erro ao buscar URL:', response.status);
            return null;
        }

        const data = await response.json();
        if (data && data.length > 0) {
            return data[0].valor;
        }
        return null;
    } catch (error: any) {
        console.error('❌ Erro ao conectar ao Supabase:', error.message);
        return null;
    }
}

async function baixarEProcessarLista(url: string) {
    try {
        console.log('🔄 Baixando lista de canais...');
        const response = await fetch(url);
        const texto = await response.text();
        const linhas = texto.split('\n');

        const canais = [];
        let canalAtual: any = null;

        for (const linha of linhas) {
            const linhaTrim = linha.trim();
            
            if (linhaTrim.startsWith('#EXTINF')) {
                const nomeMatch = linhaTrim.match(/,([^,]+)$/);
                const logoMatch = linhaTrim.match(/tvg-logo="([^"]*)"/);
                const grupoMatch = linhaTrim.match(/group-title="([^"]*)"/);
                
                canalAtual = {
                    name: nomeMatch ? nomeMatch[1] : 'Canal',
                    logo: logoMatch ? logoMatch[1] : '',
                    group: grupoMatch ? grupoMatch[1] : 'Geral',
                    stream: null
                };
            }
            
            if (linhaTrim.startsWith('http') && canalAtual) {
                canalAtual.stream = linhaTrim;
                canais.push(canalAtual);
                canalAtual = null;
            }
        }

        console.log(`✅ ${canais.length} canais carregados`);
        canaisCache = canais;
        ultimaAtualizacao = Date.now();
        return canais;

    } catch (error: any) {
        console.error('❌ Erro ao baixar lista:', error.message);
        return canaisCache || [];
    }
}

async function carregarCanais() {
    if (canaisCache && (Date.now() - ultimaAtualizacao) < TEMPO_CACHE) {
        return canaisCache;
    }

    const urlLista = await buscarUrlLista();
    
    if (!urlLista) {
        console.log('⚠️ URL da lista não encontrada no Supabase');
        const FALLBACK_URL = 'https://cr7v.short.gy/TV';
        console.log(`🔄 Usando fallback: ${FALLBACK_URL}`);
        return await baixarEProcessarLista(FALLBACK_URL);
    }

    console.log(`📡 URL da lista obtida do Supabase: ${urlLista}`);
    return await baixarEProcessarLista(urlLista);
}

export async function buscarCanais(query?: string, grupo?: string, limit?: number) {
    const todos = await carregarCanais();
    let resultados = todos;
    
    if (grupo) {
        resultados = resultados.filter(c => c.group === grupo);
    }
    
    if (query) {
        const termo = query.toLowerCase();
        resultados = resultados.filter(c => 
            c.name.toLowerCase().includes(termo) ||
            (c.group && c.group.toLowerCase().includes(termo))
        );
    }
    
    if (limit) {
        resultados = resultados.slice(0, limit);
    }
    
    return {
        total: resultados.length,
        canais: resultados
    };
}

export async function listarGrupos() {
    const todos = await carregarCanais();
    const grupos = new Set<string>();
    todos.forEach(c => {
        if (c.group) {
            grupos.add(c.group);
        }
    });
    return Array.from(grupos).sort();
}

export default {
    buscarCanais,
    listarGrupos
};
