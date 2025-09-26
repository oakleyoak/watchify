const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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

  const { magnet, action } = event.queryStringParameters || {};

  if (!magnet) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Magnet link is required' })
    };
  }

  try {
    // For now, return a placeholder HLS stream
    // In a real implementation, this would:
    // 1. Parse magnet link
    // 2. Download torrent using webtorrent
    // 3. Convert to HLS segments
    // 4. Return HLS playlist URL

    if (action === 'playlist') {
      // Return HLS playlist
      const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
segment1.ts
#EXTINF:10.0,
segment2.ts
#EXT-X-ENDLIST`;

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/vnd.apple.mpegurl'
        },
        body: playlist
      };
    } else if (action === 'segment') {
      // Return video segment (placeholder)
      // In real implementation, this would serve actual HLS segments
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'video/MP2T'
        },
        body: 'placeholder_segment_data', // Binary HLS segment data
        isBase64Encoded: true
      };
    }

    // Default: return stream info
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        streamUrl: `/.netlify/functions/hls?magnet=${encodeURIComponent(magnet)}&action=playlist`,
        type: 'hls',
        magnet: magnet
      })
    };

  } catch (error) {
    console.error('HLS streaming error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Streaming failed', details: error.message })
    };
  }
};