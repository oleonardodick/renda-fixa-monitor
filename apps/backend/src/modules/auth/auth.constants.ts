import { INVALID_CREDENTIALS_MESSAGE } from "@renda-fixa-monitor/shared";

/** Nome do cookie que armazena o access token (expira em 1 hora). */
export const ACCESS_TOKEN_COOKIE = "accessToken";

/** Nome do cookie que armazena o refresh token (expira em 1 dia). */
export const REFRESH_TOKEN_COOKIE = "refreshToken";

/** Tempo de vida do access token em segundos (1 hora). */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60;

/** Tempo de vida do refresh token em segundos (1 dia). */
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 24 * 60 * 60;

/** Tempo de vida do access token aceito pelo @fastify/jwt (1 hora). */
export const ACCESS_TOKEN_TTL = "1h";

/** Tempo de vida do refresh token aceito pelo @fastify/jwt (1 dia). */
export const REFRESH_TOKEN_TTL = "1d";

export { INVALID_CREDENTIALS_MESSAGE };