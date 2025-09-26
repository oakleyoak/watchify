const TorrentSearchApi = require('torrent-search-api');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { query, category, limit = 20 } = event.queryStringParameters || {};

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query parameter is required' })
      };
    }

    // Enable public providers
    TorrentSearchApi.enablePublicProviders();

    // Search torrents
    const torrents = await TorrentSearchApi.search(query, category === 'all' ? undefined : category, parseInt(limit));

    // Map results to our format
    const mappedTorrents = torrents.map(torrent => ({
      title: torrent.title || 'Unknown Title',
      size: torrent.size || 'Unknown',
      seeders: torrent.seeds || 0,
      magnet: torrent.magnet || '',
      poster_url: torrent.desc || ''
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results: mappedTorrents })
    };

  } catch (error) {
    console.error('Search error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Search failed', details: error.message })
    };
  }
};