import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  searchOpen: boolean;
  exportOpen: boolean;
  historyOpen: boolean;
  previewMode: boolean;
  currentTime: Date;

  setSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  setHistoryOpen: (open: boolean) => void;
  setPreviewMode: (preview: boolean) => void;
  tickTime: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  searchOpen: false,
  exportOpen: false,
  historyOpen: false,
  previewMode: false,
  currentTime: new Date(),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setExportOpen: (open) => set({ exportOpen: open }),
  setHistoryOpen: (open) => set({ historyOpen: open }),
  setPreviewMode: (preview) => set({ previewMode: preview }),
  tickTime: () => set({ currentTime: new Date() }),
}));
