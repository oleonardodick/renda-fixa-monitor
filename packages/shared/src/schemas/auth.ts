import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signInResponseSchema = z.object({
  userId: z.string(),
});

export type SignInResponse = z.infer<typeof signInResponseSchema>;

/** Resposta de GET /auth/me: sessão atual do usuário autenticado. */
export type AuthMeResponse = SignInResponse;

/**
 * Mensagem genérica de credenciais inválidas.
 * Não deve indicar se o e-mail ou a senha está incorreto.
 */
export const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha inválidos.";