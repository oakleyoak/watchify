/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface TorrentSearchParams {
  query: string;
  category: string;
  resolution: string;
}

interface TorrentSearchResult {
  title: string;
  size: string;
  seeders: number;
  magnet: string;
  poster_url: string;
  hasValidMagnet: boolean;
}

interface WebTorrentServer {
  listen: (port: number, callback?: () => void) => void;
  on: (event: string, callback: (error: Error) => void) => void;
  close: () => void;
}

interface WebTorrentTorrent {
  name: string;
  infoHash: string;
  files: Array<{ name: string; length: number }>;
  createServer: () => WebTorrentServer;
  destroy: () => void;
}

interface WebTorrentInstance {
  add: (magnetUri: string, options: { announce?: string[] }, callback: (torrent: WebTorrentTorrent) => void) => void;
  on: (event: string, callback: (error: Error) => void) => void;
  destroy: () => void;
}

interface WebTorrentConstructor {
  new (): WebTorrentInstance;
}

interface ElectronAPI {
  openInVLC: (magnetUri: string) => Promise<{ success: boolean; error?: string; method?: string }>;
  copyToClipboard: (text: string) => Promise<void>;
  searchTorrents: (searchParams: TorrentSearchParams) => Promise<{ success: boolean; results?: TorrentSearchResult[]; error?: string }>;
  setVLCAsDefault: () => Promise<{ success: boolean; error?: string }>;
  testVLC: () => Promise<{ success: boolean; version?: string; error?: string }>;
  startWebTorrentStream: (magnetUri: string) => Promise<{ success: boolean; streamUrl?: string; torrentName?: string; fileName?: string; fileSize?: number; error?: string }>;
  stopWebTorrentStream: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    WebTorrent: WebTorrentConstructor;
    electronAPI?: ElectronAPI;
  }
}