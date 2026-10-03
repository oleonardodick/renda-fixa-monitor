import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "../services/authService";
import { useAuthStore } from "../stores/authStore";

export function useSignOut() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);

    try {
      await signOut();
    } catch {
      // Mesmo em caso de falha na chamada, a sessão local é encerrada
      // para que o usuário não fique preso na tela atual.
    } finally {
      clearSession();
      setIsPending(false);
      navigate("/login");
    }
  }

  return { handleSignOut, isPending };
}