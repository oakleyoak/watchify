const WebTorrent = require('webtorrent');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes'
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
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { magnet } = event.queryStringParameters || {};

    if (!magnet) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Magnet parameter is required' })
      };
    }

    // Decode the magnet URL
    const decodedMagnet = decodeURIComponent(magnet);

    console.log('Starting torrent streaming for:', decodedMagnet);

    // Create WebTorrent client
    const client = new WebTorrent();

    return new Promise((resolve, reject) => {
      // Set timeout for torrent operations
      const timeout = setTimeout(() => {
        client.destroy();
        resolve({
          statusCode: 408,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Torrent streaming timeout' })
        });
      }, 30000); // 30 second timeout

      client.add(decodedMagnet, { announce: ['wss://tracker.btorrent.xyz', 'wss://tracker.openwebtorrent.com'] }, (torrent) => {
        console.log('Torrent added:', torrent.infoHash);

        // Find the largest video file
        const videoFiles = torrent.files.filter(file =>
          file.name.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i)
        );

        if (videoFiles.length === 0) {
          clearTimeout(timeout);
          client.destroy();
          resolve({
            statusCode: 404,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'No video files found in torrent' })
          });
          return;
        }

        // Sort by size and get the largest
        videoFiles.sort((a, b) => b.length - a.length);
        const videoFile = videoFiles[0];

        console.log('Streaming file:', videoFile.name, 'Size:', videoFile.length);

        // Handle range requests for video streaming
        const range = event.headers.range || event.headers.Range;
        let start = 0;
        let end = videoFile.length - 1;

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          start = parseInt(parts[0], 10);
          end = parts[1] ? parseInt(parts[1], 10) : videoFile.length - 1;
        }

        const chunksize = end - start + 1;

        // Create read stream for the requested range
        const stream = videoFile.createReadStream({ start, end });

        // Collect stream data
        const chunks = [];
        let totalBytes = 0;

        stream.on('data', (chunk) => {
          chunks.push(chunk);
          totalBytes += chunk.length;
        });

        stream.on('end', () => {
          clearTimeout(timeout);
          client.destroy();

          const buffer = Buffer.concat(chunks);

          resolve({
            statusCode: range ? 206 : 200,
            headers: {
              ...headers,
              'Content-Length': buffer.length.toString(),
              'Content-Range': range ? `bytes ${start}-${end}/${videoFile.length}` : undefined,
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
          });
        });

        stream.on('error', (error) => {
          console.error('Stream error:', error);
          clearTimeout(timeout);
          client.destroy();
          resolve({
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Streaming error: ' + error.message })
          });
        });
      });

      client.on('error', (error) => {
        console.error('Client error:', error);
        clearTimeout(timeout);
        resolve({
          statusCode: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Torrent client error: ' + error.message })
        });
      });
    });

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error: ' + error.message })
    };
  }
};