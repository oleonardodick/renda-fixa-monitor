import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { loadEnvConfig } from "../config/env.js";

async function jwtPlugin(fastify: FastifyInstance, _opts: object) {
  const config = loadEnvConfig();

  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret,
    sign: {
      expiresIn: config.jwtExpiresIn,
    },
  });
}

export default fp(jwtPlugin, {
  name: "jwt",
});

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      sub: string;
      email: string;
    };
  }
}
