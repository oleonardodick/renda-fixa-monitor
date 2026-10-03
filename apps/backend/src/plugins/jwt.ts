import fastifyJwt, { type FastifyJwtNamespace } from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { loadEnvConfig } from "../config/env.js";
import { ACCESS_TOKEN_COOKIE } from "../modules/auth/auth.constants.js";

async function jwtPlugin(fastify: FastifyInstance) {
  const config = loadEnvConfig();

  // Instância responsável pelos access tokens. Permite verificação via header
  // Authorization (Bearer) ou pelo cookie HttpOnly `accessToken`.
  await fastify.register(fastifyJwt, {
    namespace: "access",
    secret: config.jwtSecret,
    sign: {
      expiresIn: config.jwtExpiresIn,
    },
    cookie: {
      cookieName: ACCESS_TOKEN_COOKIE,
      signed: false,
    },
  });

  // Instância com segredo próprio para os refresh tokens, impedindo que um
  // refresh token seja aceito como access token.
  await fastify.register(fastifyJwt, {
    namespace: "refresh",
    secret: config.jwtRefreshSecret,
  });
}

export default fp(jwtPlugin, {
  name: "jwt",
});

declare module "@fastify/jwt" {
  interface FastifyJWT {
    namespaces: "access" | "refresh";
    user: {
      sub: string;
      email: string;
    };
  }
}

declare module "fastify" {
  interface FastifyRequest {
    accessJwtVerify: FastifyJwtNamespace<{ namespace: "access" }>["accessJwtVerify"];
  }
}
