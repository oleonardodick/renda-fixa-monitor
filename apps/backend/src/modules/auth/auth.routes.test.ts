import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { IUserRepository, User } from "../users/user.repository.js";
import { buildServer } from "../../server.js";
import { getCookieEntries, getCookieValue } from "../../tests/helpers.js";

process.env.JWT_SECRET ??= "test-access-secret";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret";
process.env.BCRYPT_SALT_ROUNDS ??= "4";

const TEST_EMAIL = "maria.oliveira@example.com";
const TEST_PASSWORD = "senha-segura-123";

const fakeUser: User = {
  id: "68d0f2a1b4c3d5e6f7a8b9c0",
  name: "Maria Oliveira",
  email: TEST_EMAIL,
  passwordHash: "",
};

const userRepository: IUserRepository = {
  findByEmail: async (email) => (email === TEST_EMAIL ? fakeUser : null),
  findById: async (id) => (id === fakeUser.id ? fakeUser : null),
  // A criação de usuário é coberta pelos testes de POST /users.
  create: async () => {
    throw new Error("Criação de usuário não é exercitada neste teste.");
  },
};

let app: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
  fakeUser.passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
  app = await buildServer({ registerMongoose: false, userRepository, registerRateLimit: false });
});

afterAll(async () => {
  await app.close();
});

describe("POST /auth/login", () => {
  it("deve autenticar o usuário, retornar os dados e iniciar a sessão com cookies HttpOnly", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: fakeUser.id,
      name: "Maria Oliveira",
      email: TEST_EMAIL,
    });

    const entries = getCookieEntries(response);
    const accessCookie = entries.find((header) => header.startsWith("accessToken="));
    const refreshCookie = entries.find((header) => header.startsWith("refreshToken="));

    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();
    expect(accessCookie).toContain("HttpOnly");
    expect(accessCookie).toContain("SameSite=Lax");
    expect(accessCookie).toContain("Path=/");
    expect(accessCookie).not.toContain("Secure");

    const accessPayload = await app.jwt.access.decode<{
      sub: string;
      email: string;
      iat: number;
      exp: number;
    }>(getCookieValue(response, "accessToken"));

    expect(accessPayload).not.toBeNull();
    expect(accessPayload!.sub).toBe(fakeUser.id);
    expect(accessPayload!.email).toBe(TEST_EMAIL);
    expect(accessPayload!.exp - accessPayload!.iat).toBe(60 * 60);

    const refreshPayload = await app.jwt.refresh.decode<{
      sub: string;
      iat: number;
      exp: number;
    }>(getCookieValue(response, "refreshToken"));

    expect(refreshPayload).not.toBeNull();
    expect(refreshPayload!.sub).toBe(fakeUser.id);
    expect(refreshPayload!.exp - refreshPayload!.iat).toBe(24 * 60 * 60);
  });

  it("não deve retornar campos fora da allowlist nem dados sensíveis", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    expect(Object.keys(response.json())).toEqual(["id", "name", "email"]);
    expect(response.body).not.toContain("passwordHash");
    expect(response.body).not.toContain(fakeUser.passwordHash);
    expect(response.body).not.toContain(TEST_PASSWORD);
  });

  it("não deve permitir que os dados do usuário sejam armazenados em cache", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("deve retornar erro genérico quando a senha está incorreta", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: TEST_EMAIL, password: "senha-errada" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      statusCode: 401,
      error: "Unauthorized",
      message: "E-mail ou senha inválidos.",
    });
    expect(getCookieEntries(response)).toHaveLength(0);
  });

  it("deve retornar o mesmo erro genérico quando o e-mail não existe", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "desconhecido@example.com", password: "qualquer-senha" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().message).toBe("E-mail ou senha inválidos.");
    expect(response.json().error).toBe("Unauthorized");
  });
});

describe("POST /auth/login validação de entrada", () => {
  it("deve retornar erro de validação para e-mail com formato inválido", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "e-mail-invalido", password: "senha-123" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe("Informe um e-mail válido.");
  });

  it("deve retornar erro de validação para senha vazia", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: TEST_EMAIL, password: "" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe("Informe sua senha.");
  });
});

describe("POST /auth/logout", () => {
  it("deve limpar os cookies de sessão e responder 204", async () => {
    const response = await app.inject({ method: "POST", url: "/auth/logout" });

    expect(response.statusCode).toBe(204);

    const entries = getCookieEntries(response);
    const accessCookie = entries.find((header) => header.startsWith("accessToken="));
    const refreshCookie = entries.find((header) => header.startsWith("refreshToken="));

    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();
    expect(accessCookie).toContain("accessToken=;");
    expect(accessCookie).toContain("HttpOnly");
    expect(refreshCookie).toContain("refreshToken=;");
  });
});

describe("GET /auth/me", () => {
  /** Autentica via login e devolve o cookie de acesso da sessão. */
  async function signInCookie(): Promise<string> {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    return getCookieValue(login, "accessToken");
  }

  it("deve retornar os dados do usuário da sessão quando autenticado por cookie", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: { accessToken: await signInCookie() },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: fakeUser.id,
      name: "Maria Oliveira",
      email: TEST_EMAIL,
    });
  });

  it("não deve retornar campos fora da allowlist nem dados sensíveis", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: { accessToken: await signInCookie() },
    });

    expect(Object.keys(response.json())).toEqual(["id", "name", "email"]);
    expect(response.body).not.toContain("passwordHash");
    expect(response.body).not.toContain(fakeUser.passwordHash);
  });

  it("não deve permitir que os dados do usuário sejam armazenados em cache", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: { accessToken: await signInCookie() },
    });

    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("deve ignorar qualquer identificador enviado pelo cliente", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth/me?userId=user-999&id=user-999",
      cookies: { accessToken: await signInCookie() },
      payload: { userId: "user-999" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().id).toBe(fakeUser.id);
  });

  it("deve rejeitar a rota protegida sem access token", async () => {
    const response = await app.inject({ method: "GET", url: "/auth/me" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      statusCode: 401,
      error: "Unauthorized",
      message: "Token de autenticação inválido ou ausente.",
    });
  });

  it("deve rejeitar um access token inválido", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: { accessToken: "token-adulterado" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().message).toBe("Token de autenticação inválido ou ausente.");
  });

  it("deve rejeitar um access token expirado", async () => {
    const expiredToken = app.jwt.access.sign(
      { sub: fakeUser.id, email: TEST_EMAIL },
      { expiresIn: "-1s" },
    );

    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: { accessToken: expiredToken },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().message).toBe("Token de autenticação inválido ou ausente.");
  });

  it("deve rejeitar um refresh token usado como access token", async () => {
    const refreshToken = app.jwt.refresh.sign(
      { sub: fakeUser.id, email: TEST_EMAIL },
      { expiresIn: "1d" },
    );

    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: { accessToken: refreshToken },
    });

    expect(response.statusCode).toBe(401);
  });

  it("deve encerrar a sessão quando o usuário da sessão não existe mais", async () => {
    const accessToken = await signInCookie();
    // Simula a exclusão da conta depois que a sessão foi emitida.
    const emptyRepository: IUserRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      create: userRepository.create,
    };
    const orphanApp = await buildServer({
      registerMongoose: false,
      userRepository: emptyRepository,
      registerRateLimit: false,
    });

    try {
      const response = await orphanApp.inject({
        method: "GET",
        url: "/auth/me",
        cookies: { accessToken },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().message).toBe("Token de autenticação inválido ou ausente.");

      // A sessão não pode continuar ativa: os cookies são removidos.
      const entries = getCookieEntries(response);

      expect(entries.find((header) => header.startsWith("accessToken=;"))).toBeDefined();
      expect(entries.find((header) => header.startsWith("refreshToken=;"))).toBeDefined();
    } finally {
      await orphanApp.close();
    }
  });

  it("deve retornar erro genérico quando a leitura do usuário falha", async () => {
    const accessToken = await signInCookie();
    const failingRepository: IUserRepository = {
      findByEmail: async () => null,
      findById: async () => {
        throw new Error("conexão com o banco perdida");
      },
      create: userRepository.create,
    };
    const failingApp = await buildServer({
      registerMongoose: false,
      userRepository: failingRepository,
      registerRateLimit: false,
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const response = await failingApp.inject({
        method: "GET",
        url: "/auth/me",
        cookies: { accessToken },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        statusCode: 500,
        error: "Internal Server Error",
        message: "Erro interno do servidor.",
      });
      expect(response.body).not.toContain("conexão com o banco perdida");
      expect(JSON.stringify(consoleError.mock.calls)).not.toContain(TEST_PASSWORD);
    } finally {
      consoleError.mockRestore();
      await failingApp.close();
    }
  });
});

describe("rotas públicas", () => {
  it("deve manter o health check acessível sem autenticação", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
  });

  it("deve manter a documentação da API acessível sem autenticação", async () => {
    const response = await app.inject({ method: "GET", url: "/docs/openapi.json" });

    expect(response.statusCode).toBe(200);
    expect(response.json().paths).toHaveProperty("/auth/login");
  });

  it("deve retornar 404 para rotas não registradas em vez de 401", async () => {
    const response = await app.inject({ method: "GET", url: "/rota-inexistente" });

    expect(response.statusCode).toBe(404);
  });
});
