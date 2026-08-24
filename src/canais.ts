import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar os canais do JSON
const canaisPath = join(__dirname, 'canais.json');
let canais: any[] = [];

try {
    const data = fs.readFileSync(canaisPath, 'utf-8');
    canais = JSON.parse(data);
    console.log(`✅ ${canais.length} canais carregados`);
} catch (error) {
    console.error('❌ Erro ao carregar canais:', error);
}

export function buscarCanais(query?: string, grupo?: string, limit?: number) {
    let resultados = canais;
    
    // Filtrar por grupo
    if (grupo) {
        resultados = resultados.filter(c => c.group === grupo);
    }
    
    // Filtrar por nome
    if (query) {
        const termo = query.toLowerCase();
        resultados = resultados.filter(c => 
            c.name.toLowerCase().includes(termo) ||
            (c.group && c.group.toLowerCase().includes(termo))
        );
    }
    
    // Limitar resultados
    if (limit) {
        resultados = resultados.slice(0, limit);
    }
    
    return {
        total: resultados.length,
        canais: resultados
    };
}

export function listarGrupos() {
    const grupos = new Set<string>();
    canais.forEach(c => {
        if (c.group) {
            grupos.add(c.group);
        }
    });
    return Array.from(grupos).sort();
}

export function buscarCanalPorNome(nome: string) {
    return canais.find(c => 
        c.name.toLowerCase() === nome.toLowerCase()
    );
}

export function getCanais() {
    return canais;
}

export default {
    buscarCanais,
    listarGrupos,
    buscarCanalPorNome,
    getCanais
};
