// Electron API type declarations
interface TorrentSearchResult {
  title: string;
  size: string;
  seeders: number;
  magnet: string;
  poster_url: string;
  hasValidMagnet: boolean;
}

declare global {
  interface Window {
    electronAPI: {
      openInVLC: (magnetUri: string) => Promise<{ success: boolean; method?: string; error?: string }>;
      copyToClipboard: (text: string) => Promise<boolean>;
      searchTorrents: (searchParams: { query: string; category: string; resolution: string }) => Promise<{ success: boolean; results?: TorrentSearchResult[]; error?: string }>;
      setVLCAsDefault: () => Promise<{ success: boolean; error?: string }>;
      testVLC: () => Promise<{ success: boolean; version?: string; error?: string }>;
      startWebTorrentStream: (magnetUri: string) => Promise<{ success: boolean; streamUrl?: string; fileName?: string; fileSize?: number; method?: string; message?: string; error?: string }>;
    };
  }
}

export {};