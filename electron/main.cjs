const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
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
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icons/icon-512x512.png'),
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the app
  const startUrl = isDev
    ? process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

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
    // Try to open with VLC directly
    const { spawn } = require('child_process');
    const vlcPath = await findVLCPath();

    if (vlcPath) {
      spawn(vlcPath, [magnetUri], {
        detached: true,
        stdio: 'ignore'
      });
      return { success: true, method: 'direct' };
    } else {
      // Fallback: try to open with default magnet handler
      const success = await shell.openExternal(magnetUri);
      return { success, method: 'external' };
    }
  } catch (error) {
    console.error('Failed to open in VLC:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-to-clipboard', async (event, text) => {
  const { clipboard } = require('electron');
  clipboard.writeText(text);
  return true;
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