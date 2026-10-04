import type { FastifyReply } from "fastify";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "./auth.constants.js";

/** Tokens que compõem uma sessão do usuário. */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

interface SessionCookieOptions {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge?: number;
}

function buildCookieOptions(maxAge: number, secure: boolean): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  };
}

function buildClearCookieOptions(secure: boolean): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
  };
}

/**
 * Define os cookies de sessão (`HttpOnly`, `SameSite=Lax` e `Secure` em produção).
 * Compartilhado entre o login e o cadastro para que ambos gerem a mesma sessão.
 */
export function setSessionCookies(
  reply: FastifyReply,
  session: SessionTokens,
  secure: boolean,
): void {
  reply.setCookie(
    ACCESS_TOKEN_COOKIE,
    session.accessToken,
    buildCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS, secure),
  );
  reply.setCookie(
    REFRESH_TOKEN_COOKIE,
    session.refreshToken,
    buildCookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS, secure),
  );
}

/** Remove os cookies de sessão. */
export function clearSessionCookies(reply: FastifyReply, secure: boolean): void {
  reply.clearCookie(ACCESS_TOKEN_COOKIE, buildClearCookieOptions(secure));
  reply.clearCookie(REFRESH_TOKEN_COOKIE, buildClearCookieOptions(secure));
}
