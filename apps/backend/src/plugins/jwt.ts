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
}

export default fp(jwtPlugin, {
  name: "jwt",
});

declare module "@fastify/jwt" {
  interface FastifyJWT {
    namespaces: "access";
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
