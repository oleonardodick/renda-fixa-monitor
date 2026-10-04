import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { loadEnvConfig } from "../config/env.js";
import {
  connectRedis,
  createRedisClient,
  disconnectRedis,
  type RedisClient,
} from "../config/redis.js";

/**
 * Gerencia o ciclo de vida da conexão Redis.
 *
 * Apenas conecta, disponibiliza o cliente para a aplicação e fecha no shutdown:
 * o acesso às operações é feito pela abstração `IRedisStore`, não por aqui.
 */
async function redisPlugin(app: FastifyInstance): Promise<void> {
  // A suíte de testes não depende de um Redis real. O comportamento de conexão
  // é exercitado em `tests/redis.plugin.test.ts`, com o cliente injetado.
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const config = loadEnvConfig();
  const client = createRedisClient(config);

  // Sem um listener, o evento `error` do cliente derrubaria o processo.
  client.on("error", (error) => {
    console.warn(`Redis client error: ${error.message}`);
  });

  try {
    await connectRedis(config, client);
  } catch {
    if (config.redisRequiredOnStartup) {
      throw new Error(
        "Redis is required at startup but the connection failed. Check the Redis service and the REDIS_* configuration.",
      );
    }

    // Ainda não há feature usando Redis: a API sobe normalmente e opera sem ele.
    console.warn(
      `Redis is unavailable at ${config.redisHost}:${config.redisPort}. The API will start without it.`,
    );
  }

  // Decorado mesmo quando a conexão falhou, para a superfície da aplicação
  // permanecer estável. `pingRedis` permite verificar a disponibilidade.
  app.decorate("redis", client);

  app.addHook("onClose", async () => {
    await disconnectRedis(client);
  });
}

export default fp(redisPlugin, {
  name: "redis",
});

declare module "fastify" {
  interface FastifyInstance {
    redis: RedisClient;
  }
}
