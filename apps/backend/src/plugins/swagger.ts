import swagger from "@fastify/swagger";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { loadEnvConfig } from "../config/env.js";

async function swaggerPlugin(fastify: FastifyInstance, _opts: object) {
  const config = loadEnvConfig();
  const serverUrl = `${config.host === "0.0.0.0" ? "http://localhost" : `https://${config.host}`}:${config.port}`;

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "FGC Monitor API",
        description:
          "API para monitoramento de investimentos protegidos pelo FGC (Fundo Garantidor de Créditos).",
        version: "0.0.0",
      },
      servers: [
        {
          url: serverUrl,
          description: "Servidor de desenvolvimento",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Token JWT obtido no login.",
          },
        },
      },
    },
  });
}

export default fp(swaggerPlugin, {
  name: "swagger",
});
