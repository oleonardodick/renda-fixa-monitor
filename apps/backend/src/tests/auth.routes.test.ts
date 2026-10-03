import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { IUserRepository, User } from "../repositories/user.repository.js";
import { buildServer } from "../server.js";

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
};

let app: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
  fakeUser.passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
  app = await buildServer({ registerMongoose: false, userRepository });
});

afterAll(async () => {
  await app.close();
});

function getCookieEntries(response: { headers: Record<string, unknown> }): string[] {
  const setCookie = response.headers["set-cookie"];

  if (!setCookie) {
    return [];
  }

  return Array.isArray(setCookie) ? setCookie : [String(setCookie)];
}

function getCookieValue(response: { headers: Record<string, unknown> }, name: string): string {
  const entry = getCookieEntries(response).find((header) =>
    header.startsWith(`${name}=`),
  );

  if (!entry) {
    throw new Error(`Cookie "${name}" não encontrado na resposta.`);
  }

  return entry.split(";")[0].slice(name.length + 1);
}

describe("POST /auth/login", () => {
  it("deve autenticar o usuário e iniciar a sessão com cookies HttpOnly", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ userId: fakeUser.id });

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
  it("deve retornar o usuário da sessão quando autenticado por cookie", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: { accessToken: getCookieValue(login, "accessToken") },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ userId: fakeUser.id });
  });

  it("deve rejeitar a rota protegida sem access token", async () => {
    const response = await app.inject({ method: "GET", url: "/auth/me" });

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