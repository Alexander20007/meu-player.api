import tmdbScrape from './src/vidsrc.js';

try {
  const result = await tmdbScrape("27205", "movie");
  console.log("✅ Sucesso!");
  console.log("Filme:", result[0]?.name);
  console.log("Link do vídeo:", result[0]?.stream);
} catch (error) {
  console.error("❌ Erro:", error.message);
}
