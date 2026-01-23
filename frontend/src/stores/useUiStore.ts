import { create } from 'zustand';
import { useEffect } from 'react';

interface UiState {
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMobile: false,
  setIsMobile: (isMobile: boolean) => set({ isMobile }),
}));

// Hook to initialize and update mobile state based on window size
export const useInitializeMobileDetection = () => {
  const setIsMobile = useUiStore((state) => state.setIsMobile);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [setIsMobile]);
};
