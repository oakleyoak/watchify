const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true, // Enable web security for production
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, '../public/icons/icon-512x512.png'),
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the app
  const startUrl = `file://${path.join(__dirname, 'ui.html')}`;

  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for VLC integration
ipcMain.handle('open-in-vlc', async (event, magnetUri) => {
  try {
    console.log('Received magnet URI:', magnetUri);
    console.log('Magnet URI starts with magnet?:', magnetUri && magnetUri.startsWith('magnet:?'));

    if (!magnetUri || !magnetUri.startsWith('magnet:?')) {
      return { success: false, error: 'Invalid magnet link format' };
    }

    // Use system's default magnet link handler (typically a torrent client)
    console.log('Opening magnet link with system default handler');
    await shell.openExternal(magnetUri);

    return { success: true, method: 'system-default' };
  } catch (error) {
    console.error('Failed to open magnet link:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-to-clipboard', async (_event, text) => {
  const { clipboard } = require('electron');
  clipboard.writeText(text);
  return true;
});

// IPC handler to test VLC installation
ipcMain.handle('test-vlc', async () => {
  try {
    const vlcPath = await findVLCPath();
    if (!vlcPath) {
      return { success: false, error: 'VLC not found on system' };
    }

    const { spawn } = require('child_process');
    const testProcess = spawn(vlcPath, ['--version'], {
      stdio: 'pipe'
    });

    return new Promise((resolve) => {
      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, version: output.trim() });
        } else {
          resolve({ success: false, error: 'VLC found but failed to run' });
        }
      });

      testProcess.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC handler for torrent search
ipcMain.handle('search-torrents', async (_event, searchParams) => {
  try {
    const TorrentSearchApi = require('torrent-search-api');

    const { query, category, resolution } = searchParams;

    // Enable providers
    const providers = ['1337x', 'ThePirateBay', 'Rarbg', 'Limetorrents', 'KickassTorrents', 'Yts'];
    providers.forEach(provider => {
      try {
        TorrentSearchApi.enableProvider(provider);
      } catch (e) {
        console.warn(`Failed to enable provider ${provider}:`, e);
      }
    });

    // Search for torrents
    const searchResults = await TorrentSearchApi.search(query, category === 'all' ? 'All' : category, 50);
    console.log('Raw search results sample:', searchResults.slice(0, 2));

    // Filter and map results
    const mappedTorrents = searchResults
      .filter(torrent => !resolution || resolution === 'all' || torrent.title.toLowerCase().includes(resolution.toLowerCase()))
      .map(torrent => {
        console.log('Torrent magnet field:', torrent.magnet, 'type:', typeof torrent.magnet);
        return {
          title: torrent.title || 'Unknown Title',
          size: torrent.size || 'Unknown',
          seeders: torrent.seeds || 0,
          magnet: torrent.magnet || '',
          poster_url: torrent.poster || '',
          // Add validation
          hasValidMagnet: torrent.magnet && torrent.magnet.startsWith('magnet:?')
        };
      })
      .slice(0, 20); // Limit to 20 results

    return { success: true, results: mappedTorrents };
  } catch (error) {
    console.error('Torrent search failed:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler for WebTorrent streaming
ipcMain.handle('start-webtorrent-stream', async (_event, magnetUri) => {
  try {
    console.log('=== STARTING WEBTORRENT STREAM (MAIN PROCESS) ===');
    console.log('Magnet URI:', magnetUri);

    // Import WebTorrent dynamically in main process
    const WebTorrent = (await import('webtorrent')).default;

    // Create WebTorrent client
    const client = new WebTorrent();

    return new Promise((resolve) => {
      client.add(magnetUri, { announce: [] }, (torrent) => {
        console.log('Torrent added to WebTorrent:', torrent.name);
        console.log('Torrent info hash:', torrent.infoHash);
        console.log('Torrent files:', torrent.files.map(f => ({ name: f.name, length: f.length })));

        // Find video files
        const videoFiles = torrent.files.filter(file =>
          file.name.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm|m4v|3gp)$/i)
        );

        console.log('Video files found:', videoFiles.length);

        if (videoFiles.length === 0) {
          client.destroy();
          resolve({ success: false, error: 'No video files found in torrent. This torrent may not contain video content.' });
          return;
        }

        // Sort by size and pick the largest
        videoFiles.sort((a, b) => b.length - a.length);
        const videoFile = videoFiles[0];

        console.log('Streaming file:', videoFile.name, 'Size:', videoFile.length);

        // Create server for streaming
        const server = torrent.createServer();

        // Find an available port starting from 3001
        let port = 3001;
        const maxPort = 3010;

        const tryPort = (currentPort) => {
          if (currentPort > maxPort) {
            client.destroy();
            resolve({ success: false, error: 'Could not find an available port for streaming server' });
            return;
          }

          server.listen(currentPort, () => {
            console.log('WebTorrent server listening on port', currentPort);

            // The server serves files at /<file-index>/<file-name>
            const fileIndex = torrent.files.indexOf(videoFile);
            const encodedFileName = encodeURIComponent(videoFile.name);
            const streamUrl = `http://localhost:${currentPort}/${fileIndex}/${encodedFileName}`;

            console.log('Stream URL:', streamUrl);

            // Store references to clean up later
            global.currentTorrent = torrent;
            global.currentServer = server;
            global.currentClient = client;

            resolve({
              success: true,
              streamUrl: streamUrl,
              torrentName: torrent.name,
              fileName: videoFile.name,
              fileSize: videoFile.length
            });
          });

          server.on('error', () => {
            console.log(`Port ${currentPort} not available, trying next port...`);
            tryPort(currentPort + 1);
          });
        };

        tryPort(port);
      });

      client.on('error', (err) => {
        console.error('WebTorrent client error:', err);
        resolve({ success: false, error: 'WebTorrent client error: ' + err.message });
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (client) {
          client.destroy();
        }
        resolve({ success: false, error: 'Timeout: Could not start torrent streaming within 30 seconds' });
      }, 30000);
    });

  } catch (error) {
    console.error('Failed to start torrent stream:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler to stop streaming
ipcMain.handle('stop-webtorrent-stream', async () => {
  try {
    if (global.currentServer) {
      global.currentServer.close();
      global.currentServer = null;
    }
    if (global.currentTorrent) {
      global.currentTorrent.destroy();
      global.currentTorrent = null;
    }
    if (global.currentClient) {
      global.currentClient.destroy();
      global.currentClient = null;
    }
    return { success: true };
  } catch (error) {
    console.error('Error stopping stream:', error);
    return { success: false, error: error.message };
  }
});

// Helper function to find VLC installation path
async function findVLCPath() {
  const fs = require('fs');
  const os = require('os');
  const platform = os.platform();

  const possiblePaths = {
    win32: [
      'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
      'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe',
      'C:\\Program Files\\VLC\\vlc.exe',
      'C:\\Program Files (x86)\\VLC\\vlc.exe'
    ],
    darwin: [
      '/Applications/VLC.app/Contents/MacOS/VLC'
    ],
    linux: [
      '/usr/bin/vlc',
      '/usr/local/bin/vlc',
      '/snap/bin/vlc'
    ]
  };

  const paths = possiblePaths[platform] || [];

  for (const vlcPath of paths) {
    try {
      await fs.promises.access(vlcPath, fs.constants.F_OK);
      return vlcPath;
    } catch {
      continue;
    }
  }

  return null;
}