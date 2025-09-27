const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openInVLC: (magnetUri) => ipcRenderer.invoke('open-in-vlc', magnetUri),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  searchTorrents: (searchParams) => ipcRenderer.invoke('search-torrents', searchParams),
  setVLCAsDefault: () => ipcRenderer.invoke('set-vlc-as-default'),
  testVLC: () => ipcRenderer.invoke('test-vlc'),
  startWebTorrentStream: (magnetUri) => ipcRenderer.invoke('start-webtorrent-stream', magnetUri),
  stopWebTorrentStream: () => ipcRenderer.invoke('stop-webtorrent-stream')
});