import { z } from "zod";

/** Quantidade mínima de caracteres do nome (após remover espaços das pontas). */
export const NAME_MIN_LENGTH = 3;

/** Quantidade máxima de caracteres do nome (após remover espaços das pontas). */
export const NAME_MAX_LENGTH = 100;

/** Quantidade mínima de caracteres da senha. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Quantidade máxima de bytes da senha.
 * Limite do bcrypt: caracteres além de 72 bytes seriam truncados silenciosamente.
 */
export const PASSWORD_MAX_BYTES = 72;

/** Mensagem exibida quando o e-mail informado já pertence a um usuário. */
export const EMAIL_ALREADY_IN_USE_MESSAGE = "Este e-mail já está cadastrado.";

/** Quantidade mínima de regras de composição que a senha deve atender. */
const PASSWORD_MIN_RULES = 3;

/**
 * Padrões que definem os tipos de caracteres aceitos na senha.
 * Qualquer caractere fora de letras e dígitos conta como especial.
 */
const PASSWORD_RULES: RegExp[] = [
  /[A-Z]/, // letra maiúscula
  /[a-z]/, // letra minúscula
  /[0-9]/, // número
  /[^A-Za-z0-9]/, // caractere especial
];

const PASSWORD_RULES_DESCRIPTION = "letra maiúscula, letra minúscula, número e caractere especial";

/**
 * Tamanho da senha em bytes UTF-8.
 * Usa TextEncoder para funcionar tanto no Node (backend) quanto no navegador (frontend).
 */
function passwordByteLength(password: string): number {
  return new TextEncoder().encode(password).length;
}

function countSatisfiedPasswordRules(password: string): number {
  return PASSWORD_RULES.filter((rule) => rule.test(password)).length;
}

/** Senha forte: 8+ caracteres, até 72 bytes e ao menos 3 dos 4 tipos de caractere. */
const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .refine(
    (password) => passwordByteLength(password) <= PASSWORD_MAX_BYTES,
    `A senha deve ter no máximo ${PASSWORD_MAX_BYTES} bytes.`,
  )
  .refine(
    (password) => countSatisfiedPasswordRules(password) >= PASSWORD_MIN_RULES,
    `A senha deve combinar pelo menos ${PASSWORD_MIN_RULES} destes requisitos: ${PASSWORD_RULES_DESCRIPTION}.`,
  );

/**
 * Dados de entrada da criação de usuário.
 * Nome e e-mail são normalizados (trim/lowercase) antes da validação; a senha
 * nunca é alterada, pois qualquer modificação silenciosa impediria o usuário
 * de autenticar com a senha que digitou.
 */
export const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(NAME_MIN_LENGTH, `Informe um nome com pelo menos ${NAME_MIN_LENGTH} caracteres.`)
      .max(NAME_MAX_LENGTH, `Informe um nome com no máximo ${NAME_MAX_LENGTH} caracteres.`),
    // O formato do e-mail é validado após a normalização (trim + lowercase).
    email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Informe a confirmação da senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Resposta da criação de usuário: apenas o ID, sem nenhum dado sensível. */
export const createUserResponseSchema = z.object({
  userId: z.string(),
});

export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;

/**
 * Dados do usuário autenticado expostos pela API (`POST /auth/login` e
 * `GET /auth/me`).
 *
 * A allowlist é estrita: campos fora de `id`, `name` e `email` — como
 * `password` ou `passwordHash` — são rejeitados na validação, garantindo que
 * nenhum dado sensível ou interno vaze por engano na resposta.
 */
export const currentUserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    /** Persistido em minúsculas pelo schema do usuário. */
    email: z.string(),
  })
  .strict();

export type CurrentUser = z.infer<typeof currentUserSchema>;
