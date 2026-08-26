import { Handler } from '@netlify/functions';
import tmdbScrape from '../../src/vidsrc.js';

export const handler: Handler = async (event) => {
    const { tmdbId, type, season, episode } = event.queryStringParameters || {};

    if (!tmdbId || !type) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'text/html' },
            body: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Erro</title></head>
<body style="background:#0a0a0a;color:#fff;font-family:Arial;text-align:center;padding:50px;">
    <h1 style="color:#e50914;">❌ Erro</h1>
    <p>Parâmetros obrigatórios: <code>tmdbId</code> e <code>type</code></p>
    <p style="color:#888;font-size:14px;">Exemplo: ?tmdbId=27205&type=movie</p>
</body>
</html>
            `
        };
    }

    try {
        const seasonNum = season ? parseInt(season) : undefined;
        const episodeNum = episode ? parseInt(episode) : undefined;
        
        const result = await tmdbScrape(tmdbId, type as 'movie' | 'tv', seasonNum, episodeNum);
        const link = result && result.length > 0 ? result[0].stream : null;
        const nome = result && result.length > 0 ? result[0].name : 'Conteúdo';

        if (!link) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'text/html' },
                body: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Não encontrado</title></head>
<body style="background:#0a0a0a;color:#fff;font-family:Arial;text-align:center;padding:50px;">
    <h1 style="color:#ff4444;">❌ Nenhum link encontrado</h1>
    <p>ID: ${tmdbId} | Tipo: ${type}</p>
    <p style="color:#888;font-size:14px;">Tente outro ID ou provedor.</p>
</body>
</html>
                `
            };
        }

        const isM3U8 = result[0]?.isM3U8 === true;
        const tipoPlayer = isM3U8 ? '🎉 .m3u8 (sem anúncios)' : '📺 Iframe (com anúncios)';

        // ============================================
        // HTML DO PLAYER
        // ============================================
        const html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎬 ALX Player - ${nome}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0a0a0a;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            width: 100%;
            max-width: 1100px;
            background: #000;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 0 60px rgba(229, 9, 20, 0.15);
            border: 1px solid #1a1a2e;
        }
        .player-wrapper {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            background: #000;
        }
        .player-wrapper iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        .info-bar {
            padding: 15px 25px;
            background: #1a1a2e;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            border-top: 1px solid #1a1a2e;
        }
        .info-bar .titulo {
            color: #e50914;
            font-weight: 700;
            font-size: 18px;
        }
        .info-bar .titulo span {
            color: #fff;
            font-weight: 400;
        }
        .info-bar .badge {
            padding: 4px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            background: ${isM3U8 ? '#00ff88' : '#ffaa00'};
            color: #000;
        }
        .footer {
            color: #444;
            font-size: 12px;
            text-align: center;
            margin-top: 15px;
        }
        .footer a {
            color: #e50914;
            text-decoration: none;
        }
        .footer a:hover { text-decoration: underline; }
        @media (max-width: 600px) {
            .info-bar { flex-direction: column; text-align: center; padding: 12px 15px; }
            .info-bar .titulo { font-size: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="player-wrapper">
            <iframe src="${link}" 
                    allowfullscreen 
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen">
            </iframe>
        </div>
        <div class="info-bar">
            <div class="titulo">🎬 <span>${nome}</span></div>
            <div class="badge">${tipoPlayer}</div>
        </div>
    </div>
    <div class="footer">
        🔗 API: <a href="https://alx-player.netlify.app" target="_blank">alx-player.netlify.app</a> · 🎥 ${isM3U8 ? 'Link direto .m3u8' : 'Player do provedor'}
    </div>
</body>
</html>
        `;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: html
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/html' },
            body: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Erro</title></head>
<body style="background:#0a0a0a;color:#fff;font-family:Arial;text-align:center;padding:50px;">
    <h1 style="color:#ff4444;">❌ Erro interno</h1>
    <p>${error.message}</p>
    <p style="color:#888;font-size:14px;">Tente novamente mais tarde.</p>
</body>
</html>
            `
        };
    }
};
