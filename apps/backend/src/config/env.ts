export interface EnvConfig {
  port: number;
  host: string;
  corsOrigin: string;
  mongodbUri: string | undefined;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
  cookieSecure: boolean;
  /** Máximo de requisições de cadastro por janela de tempo. */
  rateLimitMax: number;
  /** Janela de tempo (em ms) do limite de requisições de cadastro. */
  rateLimitWindowMs: number;
  redisHost: string;
  redisPort: number;
  /** Usuário ACL do Redis. Ausente quando o Redis não exige autenticação. */
  redisUsername: string | undefined;
  /** Senha do Redis. Ausente quando o Redis não exige autenticação. */
  redisPassword: string | undefined;
  /** Banco (db) Redis selecionado após a conexão. */
  redisDb: number;
  /** Habilita a conexão TLS. Desabilitado por padrão. */
  redisTls: boolean;
  /** Prefixo aplicado às chaves para separar os dados desta aplicação. */
  redisKeyPrefix: string;
  /** Tempo máximo (ms) de espera pela conexão antes de considerar falha. */
  redisConnectTimeoutMs: number;
  /** Número de tentativas de reconexão antes de desistir. */
  redisReconnectMaxRetries: number;
  /** Atraso base (ms) do backoff exponencial entre reconexões. */
  redisReconnectBaseDelayMs: number;
  /** Faz o startup falhar quando o Redis está indisponível. */
  redisRequiredOnStartup: boolean;
}

/** Prefixo padrão das chaves, evitando colisão com outras aplicações na mesma instância. */
const DEFAULT_REDIS_KEY_PREFIX = "renda-fixa-monitor:";

/**
 * Lê uma variável de ambiente obrigatória. A mensagem não inclui o valor,
 * para não vazar segredo em log ou erro de startup.
 */
function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Set it in .env or export it as an environment variable.`);
  }

  return value;
}

/** Lê uma variável opcional: valores vazios são tratados como ausentes. */
function optionalEnv(name: string): string | undefined {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  return value;
}

function integerEnv(name: string, fallback: number, min: number, max?: number): number {
  const raw = process.env[name];
  // Variável presente mas vazia equivale a não informada: usa o padrão.
  const parsed = raw === undefined || raw.trim() === "" ? fallback : Number(raw);

  const isOutOfRange =
    !Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max);

  if (isOutOfRange) {
    const range = max === undefined ? `at least ${min}` : `between ${min} and ${max}`;

    throw new Error(
      `${name} must be an integer ${range}. Set a valid value in .env or export it as an environment variable.`,
    );
  }

  return parsed;
}

function booleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];

  if (raw === undefined) {
    return fallback;
  }

  if (raw !== "true" && raw !== "false") {
    throw new Error(
      `${name} must be either "true" or "false". Set a valid value in .env or export it as an environment variable.`,
    );
  }

  return raw === "true";
}

export function loadEnvConfig(): EnvConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? "0.0.0.0",
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: requireEnv("JWT_SECRET"),
    jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET"),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
    cookieSecure:
      (process.env.COOKIE_SECURE ?? String(process.env.NODE_ENV === "production")) === "true",
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 5),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    redisHost: optionalEnv("REDIS_HOST") ?? "localhost",
    redisPort: integerEnv("REDIS_PORT", 6379, 1, 65535),
    redisUsername: optionalEnv("REDIS_USERNAME"),
    redisPassword: optionalEnv("REDIS_PASSWORD"),
    redisDb: integerEnv("REDIS_DB", 0, 0),
    redisTls: booleanEnv("REDIS_TLS", false),
    redisKeyPrefix: optionalEnv("REDIS_KEY_PREFIX") ?? DEFAULT_REDIS_KEY_PREFIX,
    redisConnectTimeoutMs: integerEnv("REDIS_CONNECT_TIMEOUT_MS", 5_000, 1),
    redisReconnectMaxRetries: integerEnv("REDIS_RECONNECT_MAX_RETRIES", 3, 0),
    redisReconnectBaseDelayMs: integerEnv("REDIS_RECONNECT_BASE_DELAY_MS", 200, 1),
    redisRequiredOnStartup: booleanEnv("REDIS_REQUIRED_ON_STARTUP", false),
  };
}
