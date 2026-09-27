import scalar from "@scalar/fastify-api-reference";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export const DOCS_ROUTE_PREFIX = "/docs";

async function scalarPlugin(fastify: FastifyInstance) {
  // As rotas da documentação são públicas: não exigem token de autenticação.
  fastify.addHook("onRoute", (routeOptions) => {
    if (routeOptions.url.startsWith(DOCS_ROUTE_PREFIX)) {
      routeOptions.config = {
        ...routeOptions.config,
        isPublic: true,
      };
    }
  });

  await fastify.register(scalar, {
    routePrefix: DOCS_ROUTE_PREFIX,
    configuration: {
      title: "Renda Fixa Monitor - Documentação da API",
    },
  });
}

export default fp(scalarPlugin, {
  name: "scalar",
});
