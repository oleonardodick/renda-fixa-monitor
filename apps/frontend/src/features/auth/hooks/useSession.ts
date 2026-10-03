import { useEffect } from "react";
import { getSession } from "../services/authService";
import { useAuthStore } from "../stores/authStore";

/**
 * Resolve a sessão atual a partir do cookie HttpOnly via GET /auth/me.
 * Deve ser usado em rotas protegidas para restaurar a sessão após refresh.
 */
export function useSession() {
  const status = useAuthStore((state) => state.status);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (status !== "loading") {
      return;
    }

    let active = true;

    getSession()
      .then((response) => {
        if (active) {
          setSession(response.userId);
        }
      })
      .catch(() => {
        if (active) {
          clearSession();
        }
      });

    return () => {
      active = false;
    };
  }, [status, setSession, clearSession]);

  return status;
}