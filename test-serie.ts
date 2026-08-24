import tmdbScrape from './src/vidsrc.js';

try {
  // The Boys - Temporada 1, Episódio 1
  const result = await tmdbScrape("76479", "tv", 1, 1);
  console.log("✅ Sucesso!");
  console.log("Série:", result[0]?.name);
  console.log("Link:", result[0]?.stream);
} catch (error) {
  console.error("❌ Erro:", error.message);
}
