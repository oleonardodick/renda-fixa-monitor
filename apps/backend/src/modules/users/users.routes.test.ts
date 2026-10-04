import { EMAIL_ALREADY_IN_USE_MESSAGE } from "@renda-fixa-monitor/shared";
import bcrypt from "bcryptjs";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { IUserRepository } from "../../modules/users/user.repository.js";
import { buildServer } from "../../server.js";
import {
  createInMemoryUserRepository,
  getCookieEntries,
  getCookieValue,
} from "../../tests/helpers.js";

process.env.JWT_SECRET ??= "test-access-secret";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret";
process.env.BCRYPT_SALT_ROUNDS ??= "4";
// O cadastro possui rate limiting; os testes exercitam muitas requisições.
process.env.RATE_LIMIT_MAX = "1000";

/** Senha válida: 10 caracteres e as 4 regras de composição. */
const VALID_PASSWORD = "Senha@123";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Maria Oliveira",
    email: "maria.oliveira@example.com",
    password: VALID_PASSWORD,
    confirmPassword: VALID_PASSWORD,
    ...overrides,
  };
}

function createApp(userRepository: IUserRepository) {
  return buildServer({ registerMongoose: false, userRepository });
}

const repository = createInMemoryUserRepository();
let app: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
  app = await createApp(repository);
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  repository.reset();
});

/** Envia o cadastro e devolve a resposta do Fastify. */
function signUp(payload: Record<string, unknown> = validPayload()) {
  return app.inject({ method: "POST", url: "/users", payload });
}

describe("POST /users", () => {
  describe("criação bem-sucedida", () => {
    it("deve persistir o usuário, criar a sessão e retornar apenas o ID", async () => {
      const response = await signUp();

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({ userId: "user-1" });

      expect(repository.users).toHaveLength(1);
      expect(repository.users[0]).toMatchObject({
        id: "user-1",
        name: "Maria Oliveira",
        email: "maria.oliveira@example.com",
      });
    });

    it("deve armazenar a senha somente como hash bcrypt", async () => {
      await signUp();

      const storedHash = repository.users[0].passwordHash;

      expect(storedHash).not.toBe(VALID_PASSWORD);
      expect(storedHash.startsWith("$2")).toBe(true);
      expect(await bcrypt.compare(VALID_PASSWORD, storedHash)).toBe(true);
    });

    it("deve normalizar nome e e-mail antes de persistir", async () => {
      await signUp(
        validPayload({
          name: "  Maria Oliveira  ",
          email: "  MARIA.OLIVEIRA@Example.COM  ",
        }),
      );

      expect(repository.users[0]).toMatchObject({
        name: "Maria Oliveira",
        email: "maria.oliveira@example.com",
      });
    });

    it("deve iniciar sessão com cookies HttpOnly da feature de Login", async () => {
      const response = await signUp();

      const entries = getCookieEntries(response);
      const accessCookie = entries.find((header) => header.startsWith("accessToken="));
      const refreshCookie = entries.find((header) => header.startsWith("refreshToken="));

      expect(accessCookie).toBeDefined();
      expect(refreshCookie).toBeDefined();
      expect(accessCookie).toContain("HttpOnly");
      expect(accessCookie).toContain("SameSite=Lax");
      expect(accessCookie).toContain("Path=/");
      expect(accessCookie).not.toContain("Secure");

      const accessPayload = await app.jwt.access.decode<{ sub: string; email: string }>(
        getCookieValue(response, "accessToken"),
      );

      expect(accessPayload?.sub).toBe("user-1");
      expect(accessPayload?.email).toBe("maria.oliveira@example.com");
    });

    it("deve autenticar o usuário recém-criado em /auth/me", async () => {
      const signUpResponse = await signUp();

      const response = await app.inject({
        method: "GET",
        url: "/auth/me",
        cookies: { accessToken: getCookieValue(signUpResponse, "accessToken") },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        id: "user-1",
        name: "Maria Oliveira",
        email: "maria.oliveira@example.com",
      });
    });

    it("não deve retornar dados sensíveis na resposta", async () => {
      const response = await signUp();

      expect(response.body).not.toContain(VALID_PASSWORD);
      expect(response.body).not.toContain(repository.users[0].passwordHash);
      expect(Object.keys(response.json())).toEqual(["userId"]);
    });
  });

  describe("validação de entrada", () => {
    it("deve rejeitar nome com menos de 3 caracteres", async () => {
      const response = await signUp(validPayload({ name: "Ma" }));

      expect(response.statusCode).toBe(400);
      expect(response.json().errors).toContainEqual({
        field: "name",
        message: "Informe um nome com pelo menos 3 caracteres.",
      });
      expect(repository.users).toHaveLength(0);
    });

    it("deve rejeitar nome com mais de 100 caracteres", async () => {
      const response = await signUp(validPayload({ name: "a".repeat(101) }));

      expect(response.statusCode).toBe(400);
      expect(response.json().errors[0].field).toBe("name");
      expect(repository.users).toHaveLength(0);
    });

    it("deve rejeitar nome composto apenas por espaços", async () => {
      const response = await signUp(validPayload({ name: "     " }));

      expect(response.statusCode).toBe(400);
      expect(response.json().errors[0].field).toBe("name");
      expect(repository.users).toHaveLength(0);
    });

    it("deve rejeitar e-mail com formato inválido", async () => {
      const response = await signUp(validPayload({ email: "e-mail-invalido" }));

      expect(response.statusCode).toBe(400);
      expect(response.json().errors).toContainEqual({
        field: "email",
        message: "Informe um e-mail válido.",
      });
      expect(repository.users).toHaveLength(0);
    });
  });

  describe("e-mail já cadastrado", () => {
    it("deve retornar 409 com o erro no campo email", async () => {
      await signUp();

      const response = await signUp();

      expect(response.statusCode).toBe(409);
      expect(response.json().errors).toContainEqual({
        field: "email",
        message: EMAIL_ALREADY_IN_USE_MESSAGE,
      });
      expect(repository.users).toHaveLength(1);
    });

    it("deve considerar e-mails iguais com caixa e espaços diferentes", async () => {
      await signUp();

      const response = await signUp(validPayload({ email: "  MARIA.OLIVEIRA@Example.com  " }));

      expect(response.statusCode).toBe(409);
      expect(repository.users).toHaveLength(1);
    });

    it("deve criar um único usuário em requisições simultâneas com o mesmo e-mail", async () => {
      const responses = await Promise.all([signUp(), signUp()]);
      const statuses = responses.map((response) => response.statusCode).sort();

      expect(statuses).toEqual([201, 409]);
      expect(repository.users).toHaveLength(1);

      const conflict = responses.find((response) => response.statusCode === 409);

      expect(conflict?.json().errors[0].field).toBe("email");
    });
  });

  describe("regras de senha", () => {
    it("deve rejeitar senha com menos de 8 caracteres", async () => {
      const response = await signUp(validPayload({ password: "Se@1a", confirmPassword: "Se@1a" }));

      expect(response.statusCode).toBe(400);
      expect(response.json().errors).toContainEqual({
        field: "password",
        message: "A senha deve ter pelo menos 8 caracteres.",
      });
      expect(repository.users).toHaveLength(0);
    });

    it("deve rejeitar senha com mais de 72 bytes", async () => {
      const longPassword = "Aa1!" + "a".repeat(69);

      const response = await signUp(
        validPayload({ password: longPassword, confirmPassword: longPassword }),
      );

      expect(response.statusCode).toBe(400);
      expect(response.json().errors).toContainEqual({
        field: "password",
        message: "A senha deve ter no máximo 72 bytes.",
      });
      expect(repository.users).toHaveLength(0);
    });

    it("deve rejeitar senha que atende a apenas 2 das 4 regras", async () => {
      const response = await signUp(
        validPayload({ password: "senha123", confirmPassword: "senha123" }),
      );

      expect(response.statusCode).toBe(400);
      expect(response.json().errors[0].field).toBe("password");
      expect(repository.users).toHaveLength(0);
    });

    it("deve aceitar senha que atende a exatamente 3 das 4 regras", async () => {
      const response = await signUp(
        validPayload({ password: "Senha123", confirmPassword: "Senha123" }),
      );

      expect(response.statusCode).toBe(201);
      expect(repository.users).toHaveLength(1);
    });

    it("deve aceitar senha que atende as 4 regras", async () => {
      const response = await signUp();

      expect(response.statusCode).toBe(201);
      expect(repository.users).toHaveLength(1);
    });

    it("deve rejeitar confirmação de senha diferente da senha", async () => {
      const response = await signUp(validPayload({ confirmPassword: "Outra@123" }));

      expect(response.statusCode).toBe(400);
      expect(response.json().errors).toContainEqual({
        field: "confirmPassword",
        message: "As senhas não coincidem.",
      });
      expect(repository.users).toHaveLength(0);
    });
  });

  describe("falhas inesperadas", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("deve retornar erro genérico quando a persistência falha", async () => {
      const failingRepository: IUserRepository = {
        findByEmail: async () => null,
        findById: async () => null,
        create: async () => {
          throw new Error("conexão com o banco perdida");
        },
      };

      const failingApp = await createApp(failingRepository);
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

      try {
        const response = await failingApp.inject({
          method: "POST",
          url: "/users",
          payload: validPayload(),
        });

        expect(response.statusCode).toBe(500);
        expect(response.json()).toEqual({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Erro interno do servidor.",
        });
        expect(response.body).not.toContain("conexão com o banco perdida");
      } finally {
        await failingApp.close();
      }

      // A senha jamais pode aparecer nos logs do servidor.
      expect(JSON.stringify(consoleError.mock.calls)).not.toContain(VALID_PASSWORD);
    });
  });
});
