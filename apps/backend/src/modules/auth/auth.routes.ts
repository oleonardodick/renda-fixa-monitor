import type { FastifyInstance } from "fastify";
import { loadEnvConfig } from "../../config/env.js";
import type { IUserRepository } from "../../repositories/user.repository.js";
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from "./auth.constants.js";
import {
  createLoginHandler,
  createLogoutHandler,
  createMeHandler,
  type AuthHandlerDeps,
} from "./auth.controller.js";
import type { AuthServiceDeps } from "./auth.service.js";

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

const userIdResponseSchema = {
  type: "object",
  properties: { userId: { type: "string" } },
  required: ["userId"],
  additionalProperties: false,
} as const;

export async function authRoutes(app: FastifyInstance, options: AuthRoutesOptions) {
  const config = loadEnvConfig();

  const authServiceDeps: AuthServiceDeps = {
    userRepository: options.userRepository,
    comparePassword: (plain, hash) => app.bcrypt.compare(plain, hash),
    tokenSigner: {
      signAccessToken: (payload) =>
        app.jwt.access.sign(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      signRefreshToken: (payload) =>
        app.jwt.refresh.sign(payload, { expiresIn: REFRESH_TOKEN_TTL }),
    },
  };

  const handlerDeps: AuthHandlerDeps = {
    authService: authServiceDeps,
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
          "refreshToken com validade de 1 dia). Corpo esperado: { email, password }.",
        response: {
          200: userIdResponseSchema,
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
        summary: "Retorna o usuário da sessão atual.",
        description:
          "Exige um accessToken válido (cookie HttpOnly) e retorna o ID do usuário autenticado.",
        response: {
          200: userIdResponseSchema,
          401: authErrorSchema,
        },
      },
    },
    createMeHandler(),
  );
}