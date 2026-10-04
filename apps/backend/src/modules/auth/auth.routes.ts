import type { FastifyInstance } from "fastify";
import { loadEnvConfig } from "../../config/env.js";
import type { IUserRepository } from "../users/user.repository.js";
import { createAuthServiceDeps } from "./auth.dependencies.js";
import {
  createLoginHandler,
  createLogoutHandler,
  createMeHandler,
  type AuthHandlerDeps,
} from "./auth.controller.js";

export interface AuthRoutesOptions {
  /** Repositório de usuários injetado pela composição do servidor. */
  userRepository: IUserRepository;
}

const authErrorSchema = {
  type: "object",
  properties: {
    statusCode: { type: "number" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["statusCode", "error", "message"],
  additionalProperties: false,
} as const;

/**
 * Resposta com os dados do usuário autenticado.
 * Espelha o schema estrito `currentUserSchema` do pacote `shared`: nenhum campo
 * fora da allowlist (id, name, email) é serializado na resposta.
 */
const currentUserResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
  },
  required: ["id", "name", "email"],
  additionalProperties: false,
} as const;

export async function authRoutes(app: FastifyInstance, options: AuthRoutesOptions) {
  const config = loadEnvConfig();

  const handlerDeps: AuthHandlerDeps = {
    authService: createAuthServiceDeps(app, options.userRepository),
    cookieSecure: config.cookieSecure,
  };

  app.post(
    "/login",
    {
      schema: {
        tags: ["auth"],
        summary: "Autentica o usuário e inicia uma sessão.",
        description:
          "Valida as credenciais e retorna os tokens de acesso e de atualização " +
          "por meio de cookies HttpOnly (accessToken com validade de 1 hora e " +
          "refreshToken com validade de 1 dia). Corpo esperado: { email, password }. " +
          "Retorna { id, name, email } — nenhum dado sensível é incluído — e envia " +
          "o cabeçalho Cache-Control: no-store.",
        response: {
          200: currentUserResponseSchema,
          400: authErrorSchema,
          401: authErrorSchema,
        },
      },
      config: { isPublic: true },
    },
    createLoginHandler(handlerDeps),
  );

  app.post(
    "/logout",
    {
      schema: {
        tags: ["auth"],
        summary: "Encerra a sessão do usuário.",
        description:
          "Limpa os cookies de sessão (accessToken e refreshToken) e retorna 204 sem conteúdo.",
        response: {
          401: authErrorSchema,
        },
      },
      config: { isPublic: true },
    },
    createLogoutHandler({ cookieSecure: config.cookieSecure }),
  );

  app.get(
    "/me",
    {
      schema: {
        tags: ["auth"],
        summary: "Retorna os dados do usuário da sessão atual.",
        description:
          "Exige um accessToken válido (cookie HttpOnly) e retorna { id, name, email }. " +
          "A identidade vem exclusivamente do cookie — a rota não recebe identificador " +
          "do cliente — e a resposta envia o cabeçalho Cache-Control: no-store. " +
          "Sessão ausente, inválida, expirada ou de usuário inexistente resulta em 401.",
        response: {
          200: currentUserResponseSchema,
          401: authErrorSchema,
        },
      },
    },
    createMeHandler({ cookieSecure: config.cookieSecure, userRepository: options.userRepository }),
  );
}
