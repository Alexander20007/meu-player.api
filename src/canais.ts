// API de canais - Busca os dados do Gist público
// Fonte: https://gist.github.com/carlosmarineli/c626b982f47cede0ad12f3e5b6e9ed75

const GIST_URL = 'https://gist.githubusercontent.com/carlosmarineli/c626b982f47cede0ad12f3e5b6e9ed75/raw/55630ddb141a0bc9008da0de04500b3d20d0e6c7/PLAYLIST';

let canaisCache: any[] | null = null;
let ultimaAtualizacao = 0;
const TEMPO_CACHE = 60000; // 60 segundos

async function carregarCanais() {
    // Verificar se o cache é válido
    if (canaisCache && (Date.now() - ultimaAtualizacao) < TEMPO_CACHE) {
        return canaisCache;
    }

    try {
        console.log('🔄 Baixando lista de canais do Gist...');
        const response = await fetch(GIST_URL);
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

        console.log(`✅ ${canais.length} canais carregados do Gist`);
        canaisCache = canais;
        ultimaAtualizacao = Date.now();
        return canais;

    } catch (error) {
        console.error('❌ Erro ao carregar canais do Gist:', error);
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
