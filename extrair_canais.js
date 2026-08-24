import fs from 'fs';

const playlist = fs.readFileSync('playlist.m3u', 'utf-8');
const linhas = playlist.split('\n');

const canais = [];
let canalAtual = null;

for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    
    if (linha.startsWith('#EXTINF')) {
        const nomeMatch = linha.match(/,([^,]+)$/);
        const logoMatch = linha.match(/tvg-logo="([^"]*)"/);
        const grupoMatch = linha.match(/group-title="([^"]*)"/);
        
        canalAtual = {
            name: nomeMatch ? nomeMatch[1] : 'Canal',
            logo: logoMatch ? logoMatch[1] : '',
            group: grupoMatch ? grupoMatch[1] : 'Geral',
            stream: null
        };
    }
    
    if (linha.startsWith('http') && canalAtual) {
        canalAtual.stream = linha;
        canais.push(canalAtual);
        canalAtual = null;
    }
}

console.log(`✅ Total de canais extraídos: ${canais.length}`);

fs.writeFileSync('canais.json', JSON.stringify(canais, null, 2));
console.log('✅ Salvos em canais.json');

const apenasLinks = canais.map(c => ({
    name: c.name,
    stream: c.stream,
    logo: c.logo,
    group: c.group
}));
fs.writeFileSync('canais_api.json', JSON.stringify(apenasLinks, null, 2));
console.log('✅ Salvos em canais_api.json');
