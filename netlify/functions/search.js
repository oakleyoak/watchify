const TorrentSearchApi = require('torrent-search-api');

// Disable any proxy settings
process.env.HTTP_PROXY = '';
process.env.HTTPS_PROXY = '';
process.env.http_proxy = '';
process.env.https_proxy = '';

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

    console.log('Search request received for query:', query);

    // For now, return mock data to test if the function works
    const mockResults = [
      {
        title: `${query} - Test Movie 1`,
        size: '1.2 GB',
        seeders: 150,
        magnet: 'magnet:?xt=urn:btih:mockhash1',
        poster_url: ''
      },
      {
        title: `${query} - Test Movie 2`,
        size: '800 MB',
        seeders: 89,
        magnet: 'magnet:?xt=urn:btih:mockhash2',
        poster_url: ''
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results: mockResults })
    };

  } catch (error) {
    console.error('Search error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Search failed',
        details: error.message
      })
    };
  }
};