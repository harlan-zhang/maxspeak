import { create } from 'zustand';

type Tab = 'tts' | 'clone' | 'design' | 'library';

interface NavState {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const useNavStore = create<NavState>()((set) => ({
  activeTab: 'tts',
  setActiveTab: (activeTab) => set({ activeTab }),
}));
