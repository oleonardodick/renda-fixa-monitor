import type { CurrentUser } from "@renda-fixa-monitor/shared";
import { create } from "zustand";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  /** Estado da sessão; inicia em "loading" até resolver via /auth/me. */
  status: AuthStatus;
  /**
   * Usuário autenticado (id, name, email) ou null.
   * Vive apenas em memória: a fonte da verdade é sempre o backend, restaurada
   * via GET /auth/me e nunca persistida em localStorage ou sessionStorage.
   */
  user: CurrentUser | null;
  /** Marca a sessão como autenticada com os dados do usuário. */
  setSession: (user: CurrentUser) => void;
  /** Encerra a sessão local, descartando os dados do usuário. */
  clearSession: () => void;
  /** Volta ao estado "loading", para que a sessão seja resolvida novamente. */
  resetSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  setSession: (user) => set({ status: "authenticated", user }),
  clearSession: () => set({ status: "unauthenticated", user: null }),
  resetSession: () => set({ status: "loading", user: null }),
}));