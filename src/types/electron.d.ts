interface ElectronWindow {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

interface ElectronAPI {
  platform: string;
  window: ElectronWindow;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
