import {
  apiErrorResponseSchema,
  type ApiFieldError,
  type CreateUserInput,
} from "@renda-fixa-monitor/shared";
import { isAxiosError } from "axios";
import { useState } from "react";
import type { UseFormResetField, UseFormSetError, UseFormSetFocus } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { createUser } from "../services/userService";

const REQUEST_FAILED_MESSAGE = "Não foi possível criar a conta. Tente novamente.";

/** Ordem dos campos do formulário, usada para focar o primeiro inválido. */
const CREATE_USER_FIELDS = ["name", "email", "password", "confirmPassword"] as const;

type CreateUserField = (typeof CREATE_USER_FIELDS)[number];

/** Operações do formulário usadas para aplicar os erros retornados pela API. */
export interface SignUpFormHandlers {
  setError: UseFormSetError<CreateUserInput>;
  setFocus: UseFormSetFocus<CreateUserInput>;
  resetField: UseFormResetField<CreateUserInput>;
}

function isCreateUserFieldError(
  fieldError: ApiFieldError,
): fieldError is ApiFieldError & { field: CreateUserField } {
  return (CREATE_USER_FIELDS as readonly string[]).includes(fieldError.field);
}

/** Extrai os erros por campo de uma resposta 400/409 da API. */
function parseApiFieldErrors(error: unknown): ApiFieldError[] {
  if (!isAxiosError(error)) {
    return [];
  }

  const parsed = apiErrorResponseSchema.safeParse(error.response?.data);

  return parsed.success ? (parsed.data.errors ?? []) : [];
}

export function useSignUp() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Distribui os erros da API pelos campos correspondentes e move o foco para
   * o primeiro inválido. Informa se houve algum erro aplicável a um campo.
   */
  function applyApiErrors(fieldErrors: ApiFieldError[], form: SignUpFormHandlers): boolean {
    const knownErrors = fieldErrors.filter(isCreateUserFieldError);

    knownErrors.forEach((fieldError) => {
      form.setError(fieldError.field, { type: "server", message: fieldError.message });
    });

    const firstInvalidField = CREATE_USER_FIELDS.find((field) =>
      knownErrors.some((fieldError) => fieldError.field === field),
    );

    if (!firstInvalidField) {
      return false;
    }

    form.setFocus(firstInvalidField);

    return true;
  }

  async function submit(values: CreateUserInput, form: SignUpFormHandlers) {
    setErrorMessage(null);

    try {
      const response = await createUser(values);

      setSession(response.userId);
      navigate("/dashboard");
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;

      if (status === 400 || status === 409) {
        if (!applyApiErrors(parseApiFieldErrors(error), form)) {
          setErrorMessage(REQUEST_FAILED_MESSAGE);
        }

        return;
      }

      // Falha inesperada: mantém nome e e-mail e limpa apenas as senhas.
      setErrorMessage(REQUEST_FAILED_MESSAGE);
      form.resetField("password");
      form.resetField("confirmPassword");
    }
  }

  return { submit, errorMessage };
}
