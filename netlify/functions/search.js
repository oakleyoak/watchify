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

    // Enable only one provider at a time to test
    TorrentSearchApi.enableProvider('1337x');

    // Create search queries including Turkish variations
    const searchQueries = [query];

    // Add Turkish language variations for better Turkish content discovery
    if (!query.toLowerCase().includes('turk') && !query.toLowerCase().includes('türk')) {
      searchQueries.push(`${query} turk`);
      searchQueries.push(`${query} türk`);
      searchQueries.push(`${query} türkçe`);
      searchQueries.push(`${query} altyazı`);
    }

    // Search torrents from all queries
    const allTorrents = [];
    for (const searchQuery of searchQueries) {
      try {
        console.log(`Searching for query: "${searchQuery}"`);
        const torrents = await TorrentSearchApi.search(searchQuery, category === 'all' ? undefined : category, parseInt(limit));
        console.log(`Found ${torrents.length} torrents for query: "${searchQuery}"`);
        allTorrents.push(...torrents);
      } catch (error) {
        console.error(`Search failed for query "${searchQuery}":`, error.message);
        console.error('Full error:', error);
      }
    }

    // Remove duplicates based on magnet link
    const uniqueTorrents = allTorrents.filter((torrent, index, self) =>
      index === self.findIndex(t => t.magnet === torrent.magnet)
    );

    // Sort by seeders (highest first), then prioritize Turkish content
    const sortedTorrents = uniqueTorrents.sort((a, b) => {
      // First sort by seeders
      const seedDiff = (b.seeds || 0) - (a.seeds || 0);
      if (seedDiff !== 0) return seedDiff;

      // Then prioritize Turkish content
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      const aIsTurkish = aTitle.includes('turk') || aTitle.includes('türk') || aTitle.includes('altyazı');
      const bIsTurkish = bTitle.includes('turk') || bTitle.includes('türk') || bTitle.includes('altyazı');

      if (aIsTurkish && !bIsTurkish) return -1;
      if (!aIsTurkish && bIsTurkish) return 1;
      return 0;
    });

    // Map results to our format
    const mappedTorrents = sortedTorrents.map(torrent => ({
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