import { create } from "zustand";

export interface UIState {
  /** Indica se o menu lateral (drawer) do celular está aberto. */
  isMobileMenuOpen: boolean;
  /** Alterna o estado do menu lateral entre aberto e fechado. */
  toggleMobileMenu(): void;
  /** Força o menu lateral a ficar fechado. */
  closeMobileMenu(): void;
}

const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));

export { useUIStore };
