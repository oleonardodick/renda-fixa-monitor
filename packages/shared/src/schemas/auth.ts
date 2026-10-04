import { z } from "zod";
import type { CurrentUser } from "./user.js";

export const signInSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Resposta de `POST /auth/login`: os dados do usuário autenticado.
 * Alias de `CurrentUser` para preservar o nome do contrato de autenticação
 * sem duplicar o tipo.
 */
export type SignInResponse = CurrentUser;

/** Resposta de `GET /auth/me`: dados do usuário da sessão atual. */
export type AuthMeResponse = CurrentUser;

/**
 * Mensagem genérica de credenciais inválidas.
 * Não deve indicar se o e-mail ou a senha está incorreto.
 */
export const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha inválidos.";