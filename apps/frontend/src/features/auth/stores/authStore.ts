import { create } from "zustand";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  /** Estado da sessão; inicia em "loading" até resolver via /auth/me. */
  status: AuthStatus;
  userId: string | null;
  setSession: (userId: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  userId: null,
  setSession: (userId) => set({ status: "authenticated", userId }),
  clearSession: () => set({ status: "unauthenticated", userId: null }),
}));