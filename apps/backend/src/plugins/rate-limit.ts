import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { RateLimitError } from "../errors/rate-limit-error.js";
import { loadEnvConfig } from "../config/env.js";

const RATE_LIMIT_MESSAGE = "Número máximo de requisições alcançado.";

/**
 * Rate limiting global aplicado a todas as rotas.
 * Rotas que não tiverem Rate Limit, devem explicitar isso em suas configurações
 * com `config: { rateLimit: false }`.
 */
async function rateLimitPlugin(fastify: FastifyInstance) {
  const config = loadEnvConfig();
  await fastify.register(rateLimit, {
    global: true,
    // Headers padrão (RateLimit-*) para o cliente reconhecer o limite.
    enableDraftSpec: true,
    // O plugin lança o valor devolvido aqui; o handler global traduz em 429.
    errorResponseBuilder: () => new RateLimitError(RATE_LIMIT_MESSAGE),
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
  });
}

export default fp(rateLimitPlugin, {
  name: "rate-limit",
});
