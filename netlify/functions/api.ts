import { Handler } from '@netlify/functions';
import tmdbScrape from '../../src/vidsrc.js';

export const handler: Handler = async (event) => {
  const { tmdbId, type, season, episode } = event.queryStringParameters || {};
  
  if (!tmdbId || !type) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'tmdbId e type são obrigatórios' })
    };
  }

  try {
    const seasonNum = season ? parseInt(season) : undefined;
    const episodeNum = episode ? parseInt(episode) : undefined;
    
    const result = await tmdbScrape(tmdbId, type as 'movie' | 'tv', seasonNum, episodeNum);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: String(error) })
    };
  }
};
