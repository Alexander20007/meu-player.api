import { buscarCanais, listarGrupos } from './src/canais.js';

console.log('📺 TESTANDO API DE CANAIS');
console.log('=' .repeat(40));

// Listar grupos
const grupos = listarGrupos();
console.log(`\n📂 Grupos disponíveis: ${grupos.length}`);
console.log('Primeiros 10 grupos:');
grupos.slice(0, 10).forEach(g => console.log(`  - ${g}`));

// Buscar canais
console.log('\n🔍 Buscando "sport":');
const resultado = buscarCanais('sport', undefined, 5);
console.log(`  Total: ${resultado.total} canais`);
console.log('  Primeiros 5:');
resultado.canais.slice(0, 5).forEach(c => {
    console.log(`    - ${c.name} (${c.group})`);
});
