import {
  type AuthMeResponse,
  type SignInResponse,
  signInSchema,
} from "@renda-fixa-monitor/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import { clearSessionCookies, setSessionCookies } from "./auth.cookies.js";
import { type AuthServiceDeps, signIn } from "./auth.service.js";

export interface AuthHandlerDeps {
  authService: AuthServiceDeps;
  cookieSecure: boolean;
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

    setSessionCookies(reply, session, deps.cookieSecure);

    await reply.status(200).send({ userId: session.userId } satisfies SignInResponse);
  };
}

export function createLogoutHandler(deps: Pick<AuthHandlerDeps, "cookieSecure">) {
  return async function logoutHandler(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    clearSessionCookies(reply, deps.cookieSecure);

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