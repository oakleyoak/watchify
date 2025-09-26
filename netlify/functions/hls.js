const TorrentSearchApi = require('torrent-search-api');

// Disable any proxy settings
process.env.HTTP_PROXY = '';
process.env.HTTPS_PROXY = '';
process.env.http_proxy = '';
process.env.https_proxy = '';

/**
 * Simple magnet URI parser (extracted from client-side service)
 */
class MagnetParser {
  static parse(magnetUri) {
    try {
      const url = new URL(magnetUri);
      const params = new URLSearchParams(url.search);

      const infoHash = params.get('xt')?.split(':').pop();
      const displayName = params.get('dn') || 'Unknown';
      const trackers = params.getAll('tr');

      if (!infoHash) {
        throw new Error('Invalid magnet URI: missing info hash');
      }

      return {
        raw: magnetUri,
        infoHash,
        displayName: decodeURIComponent(displayName),
        trackers,
        isValid: true
      };
    } catch (error) {
      console.error('Magnet parsing error:', error);
      return {
        raw: magnetUri,
        isValid: false,
        error: error.message
      };
    }
  }
}

/**
 * Error handler for serverless function
 */
class ErrorHandler {
  static handle(error, context = '') {
    console.error(`[${context}] Error:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  static createErrorResponse(message, statusCode = 500, details = null) {
    const error = {
      error: message,
      timestamp: new Date().toISOString()
    };

    if (details) {
      error.details = details;
    }

    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(error)
    };
  }
}

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
    return ErrorHandler.createErrorResponse('Method not allowed', 405);
  }

  try {
    const { magnet, file, action } = event.queryStringParameters || {};

    if (!magnet) {
      return ErrorHandler.createErrorResponse('Magnet parameter is required', 400);
    }

    // Parse and validate magnet URI
    const magnetInfo = MagnetParser.parse(magnet);
    if (!magnetInfo.isValid) {
      return ErrorHandler.createErrorResponse('Invalid magnet URI', 400, magnetInfo.error);
    }

    console.log('Processing HLS request:', {
      magnet: magnetInfo.displayName,
      infoHash: magnetInfo.infoHash,
      file: file || 'auto',
      action: action || 'stream'
    });

    // Handle different actions
    if (action === 'info') {
      // Return torrent information
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          magnet: magnetInfo,
          status: 'parsed',
          capabilities: ['hls_conversion', 'segmented_streaming']
        })
      };
    }

    if (action === 'playlist' || !action) {
      // Return HLS playlist
      // Note: In a real implementation, this would be generated after torrent processing
      const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
segment_000.ts
#EXTINF:10.0,
segment_001.ts
#EXT-X-ENDLIST`;

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/vnd.apple.mpegurl'
        },
        body: playlist
      };
    }

    if (action === 'segment') {
      // Return HLS segment
      // Note: In a real implementation, this would serve actual video segments
      const segmentId = event.queryStringParameters.segment || '000';

      // For demo purposes, return a minimal TS segment header
      // Real implementation would need actual video transcoding
      const mockSegment = Buffer.from([
        0x47, 0x40, 0x00, 0x10, 0x00, 0x00, 0xB0, 0x0D,
        0x00, 0x01, 0xC1, 0x00, 0x00, 0x00, 0x01, 0xE0,
        0x00, 0x18, 0x00, 0x00, 0x80, 0xC0, 0x0A, 0x31,
        0x02, 0x11, 0x01, 0xE1, 0x00, 0x08, 0x00, 0x00,
        0x80, 0xC0, 0x0A, 0x31, 0x02, 0x11, 0x00, 0x02,
        0x00, 0x00, 0x00, 0x01, 0x09, 0xF0, 0x00, 0x00,
        0x00, 0x00, 0x01, 0x67, 0x42, 0xC0, 0x1F, 0xD9,
        0x00, 0x00, 0x00, 0x01, 0x68, 0xCE, 0x3C, 0x80
      ]);

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'video/MP2T',
          'Cache-Control': 'max-age=3600'
        },
        body: mockSegment.toString('base64'),
        isBase64Encoded: true
      };
    }

    // Default response for stream action
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        magnet: magnetInfo.displayName,
        status: 'server_side_streaming_not_implemented',
        message: 'Server-side HLS conversion requires additional infrastructure. Use client-side streaming for now.',
        clientSideUrl: `/.netlify/functions/hls?magnet=${encodeURIComponent(magnet)}&action=playlist`,
        type: 'hls'
      })
    };

  } catch (error) {
    ErrorHandler.handle(error, 'HLS_FUNCTION');
    return ErrorHandler.createErrorResponse(
      'HLS streaming failed',
      500,
      error.message
    );
  }
};