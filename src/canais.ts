// API de canais - Busca os dados da lista CR7V
const LISTA_URL = 'https://cr7v.short.gy/TV';

let canaisCache: any[] | null = null;
let ultimaAtualizacao = 0;
const TEMPO_CACHE = 60000; // 60 segundos

async function carregarCanais() {
    if (canaisCache && (Date.now() - ultimaAtualizacao) < TEMPO_CACHE) {
        return canaisCache;
    }

    try {
        console.log('🔄 Baixando lista de canais da CR7V...');
        const response = await fetch(LISTA_URL);
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

        console.log(`✅ ${canais.length} canais carregados da CR7V`);
        canaisCache = canais;
        ultimaAtualizacao = Date.now();
        return canais;

    } catch (error) {
        console.error('❌ Erro ao carregar canais da CR7V:', error);
        return canaisCache || [];
    }
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
