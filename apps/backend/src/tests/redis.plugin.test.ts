import Fastify, { type FastifyInstance } from "fastify";
import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SECRET_PASSWORD = "senha-secreta-do-redis";

/**
 * Cliente falso com a mesma superfície usada pelo plugin: `connect`, `close`,
 * `on("error")` e os estados `isOpen`/`isReady`.
 */
class FakeRedisClient extends EventEmitter {
  isOpen = false;
  isReady = false;

  constructor(private readonly options: { failConnect?: boolean } = {}) {
    super();
  }

  async connect(): Promise<this> {
    if (this.options.failConnect) {
      throw new Error("Redis indisponível.");
    }

    this.isOpen = true;
    this.isReady = true;

    return this;
  }

  async close(): Promise<void> {
    if (!this.isOpen) {
      throw new Error("The client is closed");
    }

    this.isOpen = false;
    this.isReady = false;
  }

  async ping(): Promise<string> {
    return "PONG";
  }
}

const client = new FakeRedisClient();

vi.mock("redis", () => ({
  createClient: vi.fn(() => client),
}));

const { createClient } = await import("redis");
const { loadEnvConfig } = await import("../config/env.js");
const { default: redisPlugin } = await import("../plugins/redis.js");

/**
 * O plugin ignora a conexão quando `NODE_ENV=test` (o Vitest define esse valor
 * por padrão). Aqui o valor é trocado para exercitar o ciclo de vida real.
 */
async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(redisPlugin);

  return app;
}

function useFailingClient(): void {
  vi.mocked(createClient).mockReturnValueOnce(new FakeRedisClient({ failConnect: true }) as never);
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("JWT_SECRET", "segredo-de-teste");
  vi.stubEnv("JWT_REFRESH_SECRET", "segredo-de-refresh-de-teste");
  vi.stubEnv("REDIS_PASSWORD", SECRET_PASSWORD);
  vi.stubEnv("REDIS_HOST", "redis.exemplo");
  vi.stubEnv("REDIS_PORT", "6380");

  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("plugin do Redis", () => {
  it("deve decorar a instância do Fastify com o cliente", async () => {
    const app = await buildApp();

    try {
      expect(app.redis).toBe(client);
    } finally {
      await app.close();
    }
  });

  it("deve criar o cliente com as variáveis de ambiente", async () => {
    const app = await buildApp();

    try {
      expect(createClient).toHaveBeenCalledTimes(1);

      const options = vi.mocked(createClient).mock.calls[0][0] as Record<string, unknown>;
      const socket = options.socket as Record<string, unknown>;

      expect(socket).toMatchObject({ host: "redis.exemplo", port: 6380, connectTimeout: 5000 });
      expect(options).toMatchObject({ database: 0, disableOfflineQueue: true });
      expect(options.username).toBeUndefined();
      expect(options.password).toBe(SECRET_PASSWORD);
      // O prefixo é aplicado pela abstração de operações, não pelo cliente.
      expect(options.keyPrefix).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it("deve habilitar TLS quando REDIS_TLS é true", async () => {
    vi.stubEnv("REDIS_TLS", "true");

    const app = await buildApp();

    try {
      const options = vi.mocked(createClient).mock.calls[0][0] as Record<string, unknown>;

      expect((options.socket as Record<string, unknown>).tls).toBe(true);
    } finally {
      await app.close();
    }
  });

  it("deve fechar a conexão quando o servidor é encerrado", async () => {
    const app = await buildApp();

    await app.close();

    expect(client.isOpen).toBe(false);
  });
});

describe("Redis indisponível no startup", () => {
  it("deve iniciar a API e avisar quando a conexão falha", async () => {
    useFailingClient();

    const app = await buildApp();

    try {
      // Nenhuma feature usa Redis ainda: a API sobe e continua operando.
      expect(console.warn).toHaveBeenCalledWith(
        "Redis is unavailable at redis.exemplo:6380. The API will start without it.",
      );
    } finally {
      await app.close();
    }
  });

  it("deve falhar o startup quando REDIS_REQUIRED_ON_STARTUP é true", async () => {
    vi.stubEnv("REDIS_REQUIRED_ON_STARTUP", "true");
    useFailingClient();

    await expect(buildApp()).rejects.toThrow(
      /Redis is required at startup but the connection failed/,
    );
  });

  it("deve evitar exceção não tratada quando o cliente emite error", async () => {
    const app = await buildApp();

    try {
      // Um `error` sem listener derrubaria o processo.
      expect(() => client.emit("error", new Error("conexão perdida"))).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith("Redis client error: conexão perdida");
    } finally {
      await app.close();
    }
  });

  it("deve encerrar sem erro quando a conexão nunca foi estabelecida", async () => {
    useFailingClient();

    const app = await buildApp();

    // `close()` lança em um cliente nunca conectado; o shutdown não pode falhar por isso.
    await expect(app.close()).resolves.toBeUndefined();
  });
});

describe("validação das variáveis de ambiente do Redis", () => {
  it("deve aplicar os valores padrão quando as variáveis não são informadas", () => {
    vi.stubEnv("REDIS_HOST", undefined);
    vi.stubEnv("REDIS_PORT", undefined);
    vi.stubEnv("REDIS_DB", undefined);
    vi.stubEnv("REDIS_TLS", undefined);
    vi.stubEnv("REDIS_KEY_PREFIX", undefined);
    vi.stubEnv("REDIS_REQUIRED_ON_STARTUP", undefined);

    const config = loadEnvConfig();

    expect(config.redisHost).toBe("localhost");
    expect(config.redisPort).toBe(6379);
    expect(config.redisDb).toBe(0);
    expect(config.redisTls).toBe(false);
    expect(config.redisKeyPrefix).toBe("renda-fixa-monitor:");
    expect(config.redisRequiredOnStartup).toBe(false);
  });

  it("deve usar o prefixo informado na configuração", () => {
    vi.stubEnv("REDIS_KEY_PREFIX", "custom:");

    expect(loadEnvConfig().redisKeyPrefix).toBe("custom:");
  });

  it("deve tratar credenciais vazias como ausentes", () => {
    vi.stubEnv("REDIS_PASSWORD", "   ");

    const config = loadEnvConfig();

    expect(config.redisPassword).toBeUndefined();
    expect(config.redisUsername).toBeUndefined();
  });

  it("deve usar o padrão quando a variável numérica está vazia", () => {
    vi.stubEnv("REDIS_PORT", "");
    vi.stubEnv("REDIS_DB", "");

    const config = loadEnvConfig();

    expect(config.redisPort).toBe(6379);
    expect(config.redisDb).toBe(0);
  });

  it.each([
    ["REDIS_PORT", "abc"],
    ["REDIS_PORT", "70000"],
    ["REDIS_DB", "-1"],
    ["REDIS_CONNECT_TIMEOUT_MS", "0"],
    ["REDIS_RECONNECT_MAX_RETRIES", "1.5"],
    ["REDIS_RECONNECT_BASE_DELAY_MS", "0"],
    ["REDIS_TLS", "sim"],
    ["REDIS_REQUIRED_ON_STARTUP", "yes"],
  ])("deve falhar com mensagem clara quando %s é inválido", (name, value) => {
    vi.stubEnv(name, value);

    expect(() => loadEnvConfig()).toThrow(new RegExp(`^${name} must be`));
  });

  it("não deve expor o valor inválido na mensagem de erro", () => {
    vi.stubEnv("REDIS_PORT", "abc");

    let message = "";

    try {
      loadEnvConfig();
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toMatch(/^REDIS_PORT must be an integer between 1 and 65535/);
    expect(message).not.toContain("abc");
  });

  it("deve falhar o startup quando uma variável do Redis é inválida", async () => {
    vi.stubEnv("REDIS_PORT", "invalido");

    await expect(buildApp()).rejects.toThrow(/^REDIS_PORT must be/);
  });
});

describe("segurança das informações de conexão", () => {
  it("não deve expor credenciais no log de conexão", async () => {
    const app = await buildApp();

    try {
      const logged = JSON.stringify(vi.mocked(console.log).mock.calls);

      expect(logged).not.toContain(SECRET_PASSWORD);
      expect(logged).toContain("Connected to Redis at redis.exemplo:6380");
    } finally {
      await app.close();
    }
  });

  it("não deve expor credenciais no aviso de indisponibilidade", async () => {
    useFailingClient();

    const app = await buildApp();

    try {
      const warned = JSON.stringify(vi.mocked(console.warn).mock.calls);

      expect(warned).not.toContain(SECRET_PASSWORD);
    } finally {
      await app.close();
    }
  });
});
