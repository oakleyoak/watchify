// Electron API type declarations
declare global {
  interface Window {
    electronAPI: {
      openInVLC: (magnetUri: string) => Promise<{ success: boolean; method?: string; error?: string }>;
      copyToClipboard: (text: string) => Promise<boolean>;
    };
  }
}

export {};