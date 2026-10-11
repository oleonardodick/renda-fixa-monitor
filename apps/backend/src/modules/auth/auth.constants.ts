import { INVALID_CREDENTIALS_MESSAGE } from "@renda-fixa-monitor/shared";

/** Nome do cookie que armazena o access token (expira em 1 hora). */
export const ACCESS_TOKEN_COOKIE = "accessToken";

/** Tempo de vida do access token em segundos (1 hora). */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60;

/** Tempo de vida do access token aceito pelo @fastify/jwt (1 hora). */
export const ACCESS_TOKEN_TTL = "1h";

/**
 * Mensagem genérica de sessão ausente ou inválida.
 * Não indica se o cookie faltou, expirou, era inválido ou se o usuário da
 * sessão não existe mais.
 */
export const UNAUTHENTICATED_MESSAGE = "Token de autenticação inválido ou ausente.";

export { INVALID_CREDENTIALS_MESSAGE };
