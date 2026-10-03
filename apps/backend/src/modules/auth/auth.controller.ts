import {
  type AuthMeResponse,
  type SignInResponse,
  signInSchema,
} from "@renda-fixa-monitor/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "./auth.constants.js";
import { type AuthServiceDeps, signIn } from "./auth.service.js";

export interface AuthHandlerDeps {
  authService: AuthServiceDeps;
  cookieSecure: boolean;
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

export function createLoginHandler(deps: AuthHandlerDeps) {
  return async function loginHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const parsed = signInSchema.safeParse(request.body);

    if (!parsed.success) {
      await reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      });
      return;
    }

    const session = await signIn(deps.authService, parsed.data);

    reply.setCookie(
      ACCESS_TOKEN_COOKIE,
      session.accessToken,
      buildCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS, deps.cookieSecure),
    );
    reply.setCookie(
      REFRESH_TOKEN_COOKIE,
      session.refreshToken,
      buildCookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS, deps.cookieSecure),
    );

    await reply.status(200).send({ userId: session.userId } satisfies SignInResponse);
  };
}

export function createLogoutHandler(deps: Pick<AuthHandlerDeps, "cookieSecure">) {
  return async function logoutHandler(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    reply.clearCookie(ACCESS_TOKEN_COOKIE, buildClearCookieOptions(deps.cookieSecure));
    reply.clearCookie(REFRESH_TOKEN_COOKIE, buildClearCookieOptions(deps.cookieSecure));

    await reply.status(204).send();
  };
}

export function createMeHandler() {
  return async function meHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    await reply.status(200).send({ userId: request.user.sub } satisfies AuthMeResponse);
  };
}