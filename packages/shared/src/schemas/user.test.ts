import { describe, expect, it } from "vitest";
import { createUserSchema, currentUserSchema } from "./user.js";

/** Senha que atende às 4 regras de composição. */
const VALID_PASSWORD = "Senha@123";

const VALID_INPUT = {
  name: "Maria Oliveira",
  email: "maria.oliveira@example.com",
  password: VALID_PASSWORD,
  confirmPassword: VALID_PASSWORD,
};

/** Mensagem de erro do primeiro campo inválido. */
function firstErrorMessage(input: unknown): string | undefined {
  const result = createUserSchema.safeParse(input);

  return result.success ? undefined : result.error.issues[0]?.message;
}

function issuesOf(input: unknown) {
  const result = createUserSchema.safeParse(input);

  return result.success ? [] : result.error.issues;
}

describe("createUserSchema", () => {
  it("deve aceitar um cadastro válido", () => {
    const result = createUserSchema.safeParse(VALID_INPUT);

    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual(VALID_INPUT);
  });

  describe("nome", () => {
    it("deve remover espaços das pontas antes de validar", () => {
      const result = createUserSchema.safeParse({ ...VALID_INPUT, name: "  Maria  " });

      expect(result.success && result.data.name).toBe("Maria");
    });

    it("deve rejeitar nome com menos de 3 caracteres", () => {
      expect(firstErrorMessage({ ...VALID_INPUT, name: "Ma" })).toBe(
        "Informe um nome com pelo menos 3 caracteres.",
      );
    });

    it("deve aceitar nome com exatamente 3 caracteres", () => {
      expect(createUserSchema.safeParse({ ...VALID_INPUT, name: "Ana" }).success).toBe(true);
    });

    it("deve rejeitar nome com mais de 100 caracteres", () => {
      expect(firstErrorMessage({ ...VALID_INPUT, name: "a".repeat(101) })).toBe(
        "Informe um nome com no máximo 100 caracteres.",
      );
    });

    it("deve aceitar nome com exatamente 100 caracteres", () => {
      expect(createUserSchema.safeParse({ ...VALID_INPUT, name: "a".repeat(100) }).success).toBe(
        true,
      );
    });

    it("deve rejeitar nome composto apenas por espaços", () => {
      expect(firstErrorMessage({ ...VALID_INPUT, name: "     " })).toBe(
        "Informe um nome com pelo menos 3 caracteres.",
      );
    });
  });

  describe("e-mail", () => {
    it("deve remover espaços e converter para minúsculas", () => {
      const result = createUserSchema.safeParse({
        ...VALID_INPUT,
        email: "  MARIA.OLIVEIRA@Example.COM  ",
      });

      expect(result.success && result.data.email).toBe("maria.oliveira@example.com");
    });

    it("deve rejeitar e-mail com formato inválido mesmo após a normalização", () => {
      expect(firstErrorMessage({ ...VALID_INPUT, email: "  MARIA@  " })).toBe(
        "Informe um e-mail válido.",
      );
    });

    it("deve reportar o erro no campo email", () => {
      expect(issuesOf({ ...VALID_INPUT, email: "invalido" })[0]?.path).toEqual(["email"]);
    });
  });

  describe("senha", () => {
    it("deve rejeitar senha com menos de 8 caracteres", () => {
      expect(firstErrorMessage({ ...VALID_INPUT, password: "Se@1", confirmPassword: "Se@1" })).toBe(
        "A senha deve ter pelo menos 8 caracteres.",
      );
    });

    it("deve rejeitar senha com mais de 72 bytes", () => {
      const longPassword = "a".repeat(73);

      expect(
        firstErrorMessage({
          ...VALID_INPUT,
          password: longPassword,
          confirmPassword: longPassword,
        }),
      ).toBe("A senha deve ter no máximo 72 bytes.");
    });

    it("deve aceitar senha com exatamente 72 bytes", () => {
      const maxPassword = `Aa1!${"a".repeat(68)}`;

      expect(
        createUserSchema.safeParse({
          ...VALID_INPUT,
          password: maxPassword,
          confirmPassword: maxPassword,
        }).success,
      ).toBe(true);
    });

    it("deve medir o limite em bytes e não em caracteres", () => {
      // 70 caracteres, porém 84 bytes: "ç" ocupa 2 bytes em UTF-8.
      const multibytePassword = "Aa1!ç".repeat(14);

      expect(multibytePassword.length).toBeLessThan(72);
      expect(
        firstErrorMessage({
          ...VALID_INPUT,
          password: multibytePassword,
          confirmPassword: multibytePassword,
        }),
      ).toBe("A senha deve ter no máximo 72 bytes.");
    });

    it("deve rejeitar senha que atende a apenas 2 das 4 regras", () => {
      const weakPassword = "senha123";

      expect(
        firstErrorMessage({
          ...VALID_INPUT,
          password: weakPassword,
          confirmPassword: weakPassword,
        }),
      ).toBe(
        "A senha deve combinar pelo menos 3 destes requisitos: letra maiúscula, letra minúscula, número e caractere especial.",
      );
    });

    it("deve aceitar senha que atende a exatamente 3 das 4 regras", () => {
      const password = "Senha123";

      expect(
        createUserSchema.safeParse({
          ...VALID_INPUT,
          password,
          confirmPassword: password,
        }).success,
      ).toBe(true);
    });

    it("deve aceitar senha que atende as 4 regras", () => {
      expect(
        createUserSchema.safeParse({
          ...VALID_INPUT,
          password: VALID_PASSWORD,
          confirmPassword: VALID_PASSWORD,
        }).success,
      ).toBe(true);
    });

    it("não deve remover espaços da senha informada", () => {
      // Se a senha fosse aparada, o valor normalizado ("Senha@123") coincidiria
      // com a confirmação e o cadastro seria aceito indevidamente.
      const password = " Senha@123 ";

      expect(firstErrorMessage({ ...VALID_INPUT, password, confirmPassword: "Senha@123" })).toBe(
        "As senhas não coincidem.",
      );
    });

    it("deve reportar o erro no campo password", () => {
      const issues = issuesOf({ ...VALID_INPUT, password: "123", confirmPassword: "123" });

      expect(issues[0]?.path).toEqual(["password"]);
    });
  });

  describe("confirmação de senha", () => {
    it("deve rejeitar confirmação diferente da senha", () => {
      expect(firstErrorMessage({ ...VALID_INPUT, confirmPassword: "Outra@123" })).toBe(
        "As senhas não coincidem.",
      );
    });

    it("deve reportar o erro no campo confirmPassword", () => {
      expect(issuesOf({ ...VALID_INPUT, confirmPassword: "Outra@123" })[0]?.path).toEqual([
        "confirmPassword",
      ]);
    });

    it("deve rejeitar confirmação vazia", () => {
      expect(firstErrorMessage({ ...VALID_INPUT, confirmPassword: "" })).toBe(
        "Informe a confirmação da senha.",
      );
    });
  });
});

describe("currentUserSchema", () => {
  const CURRENT_USER = {
    id: "68d0f2a1b4c3d5e6f7a8b9c0",
    name: "Maria Oliveira",
    email: "maria.oliveira@example.com",
  };

  it("deve aceitar os dados do usuário autenticado", () => {
    const result = currentUserSchema.safeParse(CURRENT_USER);

    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual(CURRENT_USER);
  });

  it("deve rejeitar campos adicionais como password", () => {
    expect(currentUserSchema.safeParse({ ...CURRENT_USER, password: "Senha@123" }).success).toBe(
      false,
    );
  });

  it("deve rejeitar campos adicionais como passwordHash", () => {
    expect(
      currentUserSchema.safeParse({ ...CURRENT_USER, passwordHash: "$2b$10$hash" }).success,
    ).toBe(false);
  });

  it("deve rejeitar um usuário sem algum dos campos obrigatórios", () => {
    expect(currentUserSchema.safeParse({ ...CURRENT_USER, email: undefined }).success).toBe(false);
  });
});
