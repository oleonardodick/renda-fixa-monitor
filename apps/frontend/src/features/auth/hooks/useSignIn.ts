import { isAxiosError } from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  INVALID_CREDENTIALS_MESSAGE,
  type SignInInput,
} from "@renda-fixa-monitor/shared";
import { signIn } from "../services/authService";
import { useAuthStore } from "../stores/authStore";

const REQUEST_FAILED_MESSAGE =
  "Não foi possível conectar ao servidor. Tente novamente.";

export function useSignIn() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(values: SignInInput) {
    setErrorMessage(null);

    try {
      const response = await signIn(values);
      setSession(response.userId);
      navigate("/dashboard");
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        // Mensagem genérica: não revela se o e-mail ou a senha está incorreto.
        setErrorMessage(INVALID_CREDENTIALS_MESSAGE);
      } else {
        setErrorMessage(REQUEST_FAILED_MESSAGE);
      }
    }
  }

  return { submit, errorMessage };
}