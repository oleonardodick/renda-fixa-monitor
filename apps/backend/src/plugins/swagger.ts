import swagger from "@fastify/swagger";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { loadEnvConfig } from "../config/env.js";

async function swaggerPlugin(fastify: FastifyInstance) {
  const config = loadEnvConfig();
  const serverUrl = `${config.host === "0.0.0.0" ? "http://localhost" : `https://${config.host}`}:${config.port}`;

  // As rotas do Swagger (/documentation/*) são públicas: não exigem token de
  // autenticação. Elas servem a especificação consumida pela UI em /docs.
  fastify.addHook("onRoute", (routeOptions) => {
    if (routeOptions.url.startsWith("/documentation")) {
      routeOptions.config = {
        ...routeOptions.config,
        isPublic: true,
      };
    }
  });

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Renda Fixa Monitor API",
        description: "API para monitoramento os investimentos em Renda Fixa.",
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
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "accessToken",
            description: "Autenticação por cookie HttpOnly definido no login.",
          },
        },
      },
    },
  });
}

export default fp(swaggerPlugin, {
  name: "swagger",
});
