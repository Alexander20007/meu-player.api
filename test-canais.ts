import { buscarCanais, listarGrupos } from './src/canais.js';

console.log('📺 TESTANDO API DE CANAIS (via Gist)');
console.log('='.repeat(40));

const grupos = await listarGrupos();
console.log(`\n📂 Grupos disponíveis: ${grupos.length}`);
console.log('Primeiros 10 grupos:');
grupos.slice(0, 10).forEach(g => console.log(`  - ${g}`));

console.log('\n🔍 Buscando "sport":');
const resultado = await buscarCanais('sport', undefined, 5);
console.log(`  Total: ${resultado.total} canais`);
console.log('  Primeiros 5:');
resultado.canais.slice(0, 5).forEach(c => {
    console.log(`    - ${c.name} (${c.group})`);
});
