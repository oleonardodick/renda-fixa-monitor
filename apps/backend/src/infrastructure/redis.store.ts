import type { RedisClient } from "../config/redis.js";

/** Opções aceitas na gravação de uma chave. */
export interface RedisSetOptions {
  /** Tempo de vida da chave em segundos. Ausente, a chave não expira. */
  ttlSeconds?: number;
}

/**
 * Operações básicas que as features precisarão do Redis.
 *
 * Interface Justificada por ser a fronteira de infraestrutura: permite que as
 * regras de negócio dependam deste contrato, e não da biblioteca `redis`.
 */
export interface IRedisStore {
  /** Lê o valor da chave, ou `null` quando ela não existe. */
  get(key: string): Promise<string | null>;
  /** Grava o valor, opcionalmente com expiração. */
  set(key: string, value: string, options?: RedisSetOptions): Promise<void>;
  /** Remove a chave. Não falha quando ela não existe. */
  del(key: string): Promise<void>;
  /** Indica se a chave existe. */
  exists(key: string): Promise<boolean>;
}

/**
 * Implementação de `IRedisStore` sobre o Node Redis.
 *
 * O prefixo é aplicado aqui para que nenhuma feature precise conhecê-lo: as
 * chaves circulam sem namespace entre a regra de negócio e esta camada.
 */
export function createNodeRedisStore(client: RedisClient, keyPrefix: string): IRedisStore {
  const namespaced = (key: string): string => `${keyPrefix}${key}`;

  return {
    async get(key: string): Promise<string | null> {
      return client.get(namespaced(key));
    },

    async set(key: string, value: string, options?: RedisSetOptions): Promise<void> {
      if (options?.ttlSeconds === undefined) {
        await client.set(namespaced(key), value);
        return;
      }

      // `EX` isolado está depreciado na v6; a forma atual é `expiration`.
      await client.set(namespaced(key), value, {
        expiration: { type: "EX", value: options.ttlSeconds },
      });
    },

    async del(key: string): Promise<void> {
      await client.del(namespaced(key));
    },

    async exists(key: string): Promise<boolean> {
      // O comando EXISTS responde com a contagem de chaves encontradas.
      return (await client.exists(namespaced(key))) > 0;
    },
  };
}
