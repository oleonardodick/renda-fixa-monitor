import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { getSession } from "../services/authService";
import { useAuthStore } from "../stores/authStore";

const REQUEST_FAILED_MESSAGE = "Não foi possível carregar seus dados. Tente novamente.";

/**
 * Resolve a sessão atual a partir do cookie HttpOnly via GET /auth/me.
 * Deve ser usado em rotas protegidas para restaurar a sessão após refresh.
 *
 * Retorna o `status` da sessão e, quando a resolução falha por motivo
 * inesperado (rede ou servidor), uma mensagem genérica para exibição. Em ambos
 * os casos de falha o store é esvaziado.
 */
export function useSession() {
  const status = useAuthStore((state) => state.status);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "loading") {
      return;
    }

    let active = true;

    getSession()
      .then((response) => {
        if (active) {
          setSession(response);
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        clearSession();

        // 401 significa apenas que não há sessão válida: o redirecionamento
        // para o login já acontece, sem mensagem adicional.
        if (!isAxiosError(error) || error.response?.status !== 401) {
          setErrorMessage(REQUEST_FAILED_MESSAGE);
        }
      });

    return () => {
      active = false;
    };
  }, [status, setSession, clearSession]);

  return { status, errorMessage };
}