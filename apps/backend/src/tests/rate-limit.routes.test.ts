import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../server.js";
import { createInMemoryUserRepository } from "./helpers.js";

process.env.JWT_SECRET ??= "test-access-secret";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret";
process.env.BCRYPT_SALT_ROUNDS ??= "4";
// Limite baixo para exercitar o bloqueio sem reenviar muitas requisições.
process.env.RATE_LIMIT_MAX = "2";
process.env.RATE_LIMIT_WINDOW_MS = "60000";

const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX);

const RATE_LIMIT_MESSAGE = "Número máximo de requisições alcançado.";

let app: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
  app = await buildServer({
    registerMongoose: false,
    userRepository: createInMemoryUserRepository(),
  });
});

afterAll(async () => {
  await app.close();
});

function signUp(index: number) {
  return app.inject({
    method: "POST",
    url: "/users",
    payload: {
      name: "Maria Oliveira",
      email: `maria.${index}@example.com`,
      password: "Senha@123",
      confirmPassword: "Senha@123",
    },
  });
}

describe("rate limiting do cadastro", () => {
  it("deve bloquear com 429 em pt-BR ao exceder o limite de requisições", async () => {
    for (let index = 1; index <= RATE_LIMIT_MAX; index++) {
      const response = await signUp(index);

      expect(response.statusCode).toBe(201);
    }

    const blocked = await signUp(RATE_LIMIT_MAX + 1);

    expect(blocked.statusCode).toBe(429);
    expect(blocked.json()).toEqual({
      statusCode: 429,
      error: "Too Many Requests",
      message: RATE_LIMIT_MESSAGE,
    });
  });

  it("deve manter as rotas já existentes sem rate limiting", async () => {
    for (let index = 1; index <= RATE_LIMIT_MAX + 2; index++) {
      const response = await app.inject({ method: "GET", url: "/health" });

      expect(response.statusCode).toBe(200);
    }
  });
});
