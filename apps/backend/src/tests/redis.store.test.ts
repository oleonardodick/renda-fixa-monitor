import { describe, expect, it, vi } from "vitest";
import type { RedisClient } from "../config/redis.js";
import { createNodeRedisStore } from "../infrastructure/redis.store.js";

const KEY_PREFIX = "renda-fixa-monitor:";

/**
 * Cliente falso: registra as chamadas para verificar o contrato da abstração
 * sem depender de um Redis real.
 */
function createFakeRedisClient(overrides: Record<string, unknown> = {}): RedisClient {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    ...overrides,
  } as unknown as RedisClient;
}

describe("abstração de operações do Redis", () => {
  describe("get", () => {
    it("deve ler a chave com o prefixo configurado", async () => {
      const client = createFakeRedisClient({
        get: vi.fn().mockResolvedValue("token-de-refresh"),
      });
      const store = createNodeRedisStore(client, KEY_PREFIX);

      await expect(store.get("session:123")).resolves.toBe("token-de-refresh");
      expect(client.get).toHaveBeenCalledWith(`${KEY_PREFIX}session:123`);
    });

    it("deve retornar null quando a chave não existe", async () => {
      const client = createFakeRedisClient();
      const store = createNodeRedisStore(client, KEY_PREFIX);

      await expect(store.get("inexistente")).resolves.toBeNull();
    });
  });

  describe("set", () => {
    it("deve gravar a chave com o prefixo e sem expiração quando não há TTL", async () => {
      const client = createFakeRedisClient();
      const store = createNodeRedisStore(client, KEY_PREFIX);

      await store.set("session:123", "token-de-refresh");

      expect(client.set).toHaveBeenCalledWith(`${KEY_PREFIX}session:123`, "token-de-refresh");
    });

    it("deve aplicar a expiração em segundos quando há TTL", async () => {
      const client = createFakeRedisClient();
      const store = createNodeRedisStore(client, KEY_PREFIX);

      await store.set("session:123", "token-de-refresh", { ttlSeconds: 900 });

      expect(client.set).toHaveBeenCalledWith(`${KEY_PREFIX}session:123`, "token-de-refresh", {
        expiration: { type: "EX", value: 900 },
      });
    });
  });

  describe("del", () => {
    it("deve remover a chave com o prefixo configurado", async () => {
      const client = createFakeRedisClient();
      const store = createNodeRedisStore(client, KEY_PREFIX);

      await store.del("session:123");

      expect(client.del).toHaveBeenCalledWith(`${KEY_PREFIX}session:123`);
    });
  });

  describe("exists", () => {
    it("deve consultar a chave com o prefixo e retornar true quando existe", async () => {
      const client = createFakeRedisClient({
        exists: vi.fn().mockResolvedValue(1),
      });
      const store = createNodeRedisStore(client, KEY_PREFIX);

      await expect(store.exists("session:123")).resolves.toBe(true);
      expect(client.exists).toHaveBeenCalledWith(`${KEY_PREFIX}session:123`);
    });

    it("deve retornar false quando a chave não existe", async () => {
      const client = createFakeRedisClient({
        exists: vi.fn().mockResolvedValue(0),
      });
      const store = createNodeRedisStore(client, KEY_PREFIX);

      await expect(store.exists("session:123")).resolves.toBe(false);
    });
  });

  it("deve aplicar o prefixo em todas as operações, sem alterar a chave recebida", async () => {
    const client = createFakeRedisClient({ exists: vi.fn().mockResolvedValue(1) });
    const store = createNodeRedisStore(client, "app:");

    await store.get("chave");
    await store.set("chave", "valor");
    await store.del("chave");
    await store.exists("chave");

    for (const call of [client.get, client.set, client.del, client.exists] as unknown as ReturnType<
      typeof vi.fn
    >[]) {
      expect(call.mock.calls[0][0]).toBe("app:chave");
    }
  });
});
