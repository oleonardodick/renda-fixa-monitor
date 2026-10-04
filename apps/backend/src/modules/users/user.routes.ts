import type { FastifyInstance } from "fastify";
import { loadEnvConfig } from "../../config/env.js";
import type { IUserRepository } from "./user.repository.js";
import { createAuthServiceDeps } from "../auth/auth.dependencies.js";
import { createCreateUserHandler, type UserHandlerDeps } from "./user.controller.js";
import type { CreateUserServiceDeps } from "./user.service.js";

export interface UserRoutesOptions {
  /** Repositório de usuários injetado pela composição do servidor. */
  userRepository: IUserRepository;
}

const userIdResponseSchema = {
  type: "object",
  properties: { userId: { type: "string" } },
  required: ["userId"],
  additionalProperties: false,
} as const;

const createUserErrorSchema = {
  type: "object",
  properties: {
    statusCode: { type: "number" },
    error: { type: "string" },
    message: { type: "string" },
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: { field: { type: "string" }, message: { type: "string" } },
        required: ["field", "message"],
        additionalProperties: false,
      },
    },
  },
  required: ["statusCode", "error", "message"],
  additionalProperties: false,
} as const;

export async function userRoutes(app: FastifyInstance, options: UserRoutesOptions) {
  const config = loadEnvConfig();

  const createUserService: CreateUserServiceDeps = {
    userRepository: options.userRepository,
    hashPassword: (plain) => app.bcrypt.hash(plain),
    authService: createAuthServiceDeps(app, options.userRepository),
  };

  const handlerDeps: UserHandlerDeps = {
    createUserService,
    cookieSecure: config.cookieSecure,
  };

  app.post(
    "/",
    {
      schema: {
        tags: ["users"],
        summary: "Cria um usuário e inicia a sessão.",
        description:
          "Cadastro público. Corpo esperado: { name, email, password, confirmPassword }. " +
          "Os dados são validados com o schema compartilhado `createUserSchema` " +
          "(o mesmo do frontend), o usuário é persistido com a senha hashada via " +
          "bcrypt e os tokens de sessão são retornados por cookies HttpOnly " +
          "(accessToken com validade de 1 hora e refreshToken com validade de " +
          "1 dia). E-mail já cadastrado retorna 409 com o erro no campo email. " +
          "Sujeito a rate limiting.",
        response: {
          201: userIdResponseSchema,
          400: createUserErrorSchema,
          409: createUserErrorSchema,
          429: createUserErrorSchema,
        },
      },
      config: { isPublic: true },
    },
    createCreateUserHandler(handlerDeps),
  );
}
