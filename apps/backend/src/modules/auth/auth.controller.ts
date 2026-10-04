import {
  type AuthMeResponse,
  type SignInResponse,
  signInSchema,
} from "@renda-fixa-monitor/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import { toCurrentUser } from "../users/user.mapper.js";
import type { IUserRepository } from "../users/user.repository.js";
import { clearSessionCookies, setSessionCookies } from "./auth.cookies.js";
import { UNAUTHENTICATED_MESSAGE } from "./auth.constants.js";
import { type AuthServiceDeps, signIn } from "./auth.service.js";

export interface AuthHandlerDeps {
  authService: AuthServiceDeps;
  cookieSecure: boolean;
}

/**
 * Impede que navegadores e intermediários armazenem em cache as respostas que
 * contêm dados do usuário.
 */
const NO_STORE_HEADERS = { "cache-control": "no-store" } as const;

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

    await reply
      .headers(NO_STORE_HEADERS)
      .status(200)
      .send(session.user satisfies SignInResponse);
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

export function createMeHandler(deps: Pick<AuthHandlerDeps, "cookieSecure"> & {
  userRepository: IUserRepository;
}) {
  /**
   * Retorna os dados do usuário da sessão atual.
   *
   * A identidade vem exclusivamente do access token validado pelo middleware
   * `authenticate`: a rota não recebe id, query ou body do cliente, o que
   * impede o acesso a dados de outros usuários. Quando a sessão é válida mas o
   * usuário não existe mais, a resposta é 401 e a sessão é encerrada.
   */
  return async function meHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = await deps.userRepository.findById(request.user.sub);

    if (!user) {
      clearSessionCookies(reply, deps.cookieSecure);

      await reply.status(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: UNAUTHENTICATED_MESSAGE,
      });
      return;
    }

    await reply
      .headers(NO_STORE_HEADERS)
      .status(200)
      .send(toCurrentUser(user) satisfies AuthMeResponse);
  };
}