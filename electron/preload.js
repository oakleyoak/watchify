const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openInVLC: (magnetUri) => ipcRenderer.invoke('open-in-vlc', magnetUri),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text)
});