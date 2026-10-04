import { createClient } from "redis";
import type { EnvConfig } from "./env.js";

/**
 * Cliente do Node Redis (`redis`). É o único ponto do backend que conhece a
 * biblioteca: rotas e regras de negócio recebem apenas abstrações próprias.
 */
export type RedisClient = ReturnType<typeof createClient>;

/** Teto do backoff para não prolongar indefinidamente as tentativas. */
const MAX_RECONNECT_DELAY_MS = 5_000;

/**
 * Cria o cliente Redis a partir da configuração validada.
 * Não abre a conexão: quem controla o ciclo de vida é o plugin.
 */
export function createRedisClient(config: EnvConfig): RedisClient {
  // Na v6, TLS é uma união discriminada: `tls: true` habilita o socket TLS e
  // a ausência da opção mantém a conexão em texto puro.
  const socket = {
    host: config.redisHost,
    port: config.redisPort,
    connectTimeout: config.redisConnectTimeoutMs,
    reconnectStrategy: (retries: number) => {
      if (retries >= config.redisReconnectMaxRetries) {
        return new Error(
          `Redis connection failed after ${config.redisReconnectMaxRetries} retries.`,
        );
      }

      return Math.min(config.redisReconnectBaseDelayMs * 2 ** retries, MAX_RECONNECT_DELAY_MS);
    },
    ...(config.redisTls ? { tls: true as const } : {}),
  };

  return createClient({
    socket,
    database: config.redisDb,
    // Evita que comandos fiquem na fila indefinidamente quando o Redis está fora:
    // falham na hora, em vez de prometerem uma resposta que não virá.
    disableOfflineQueue: true,
    ...(config.redisUsername ? { username: config.redisUsername } : {}),
    ...(config.redisPassword ? { password: config.redisPassword } : {}),
  });
}

/** Conecta o cliente, propagando a falha para quem chamou. */
export async function connectRedis(config: EnvConfig, client: RedisClient): Promise<void> {
  await client.connect();

  if (process.env.NODE_ENV !== "test") {
    // Apenas host e porta: a URL completa carregaria as credenciais.
    console.log(`Connected to Redis at ${config.redisHost}:${config.redisPort}`);
  }
}

/** Fecha o cliente. Ignora clientes nunca conectados, cujo `close` lança. */
export async function disconnectRedis(client: RedisClient): Promise<void> {
  if (!client.isOpen) {
    return;
  }

  await client.close();

  if (process.env.NODE_ENV !== "test") {
    console.log("Disconnected from Redis");
  }
}

/** Verifica a saúde da conexão sem expor detalhes em respostas HTTP. */
export async function pingRedis(client: RedisClient): Promise<boolean> {
  if (!client.isReady) {
    return false;
  }

  try {
    return (await client.ping()) === "PONG";
  } catch {
    return false;
  }
}
