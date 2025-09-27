const TorrentSearchApi = require('torrent-search-api');

// Disable any proxy settings
process.env.HTTP_PROXY = '';
process.env.HTTPS_PROXY = '';
process.env.http_proxy = '';
process.env.https_proxy = '';

exports.handler = async (event) => {
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
    const { query, category = 'All', limit = 20 } = event.queryStringParameters || {};

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query parameter is required' })
      };
    }

    console.log('Search request received for query:', query, 'category:', category);

    // Enable multiple public providers for better results
    const providers = ['1337x', 'ThePirateBay', 'Rarbg', 'Limetorrents', 'KickassTorrents', 'Yts'];

    // Enable providers
    providers.forEach(provider => {
      try {
        TorrentSearchApi.enableProvider(provider);
      } catch (e) {
        console.warn(`Failed to enable provider ${provider}:`, e.message);
      }
    });

    let allResults = [];
    let errors = [];

    // Search across all enabled providers
    try {
      console.log('Searching across all enabled providers...');
      const results = await TorrentSearchApi.search(query, category, parseInt(limit));

      if (results && results.length > 0) {
        // Map results to our expected format
        const mappedResults = results.map(torrent => ({
          title: torrent.title || 'Unknown Title',
          size: torrent.size || 'Unknown',
          seeders: parseInt(torrent.seeds) || 0,
          magnet: torrent.magnet || '',
          poster_url: torrent.desc || '',
          category: torrent.category || category,
          time: torrent.time || '',
          provider: torrent.provider || 'Unknown'
        }));

        allResults = allResults.concat(mappedResults);
      }
    } catch (searchError) {
      console.warn('Error during search:', searchError.message);
      errors.push(`Search failed: ${searchError.message}`);
    }

    // Sort by seeders (most popular first) and limit results
    allResults.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));
    const limitedResults = allResults.slice(0, parseInt(limit));

    console.log(`Found ${limitedResults.length} results from ${providers.length} providers`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        results: limitedResults,
        total: limitedResults.length,
        providers: providers.length,
        errors: errors.length > 0 ? errors : undefined
      })
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