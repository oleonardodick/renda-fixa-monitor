import type { FastifyInstance } from "fastify";
import type { IUserRepository } from "../users/user.repository.js";
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from "./auth.constants.js";
import type { AuthServiceDeps } from "./auth.service.js";

/**
 * Monta as dependências do serviço de autenticação a partir dos plugins
 * (bcrypt e jwt). Compartilhado entre as rotas de autenticação e de usuários
 * para que cadastro e login compartilhem a mesma criação de sessão.
 */
export function createAuthServiceDeps(
  app: FastifyInstance,
  userRepository: IUserRepository,
): AuthServiceDeps {
  return {
    userRepository,
    comparePassword: (plain, hash) => app.bcrypt.compare(plain, hash),
    tokenSigner: {
      signAccessToken: (payload) => app.jwt.access.sign(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      signRefreshToken: (payload) =>
        app.jwt.refresh.sign(payload, { expiresIn: REFRESH_TOKEN_TTL }),
    },
  };
}
