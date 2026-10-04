import { DuplicateEmailError } from "../errors/duplicate-email-error.js";
import type { CreateUserData, IUserRepository, User } from "../modules/users/user.repository.js";

/** Repositório de usuários em memória usado nos testes de integração das rotas. */
export interface InMemoryUserRepository extends IUserRepository {
  /** Usuários persistidos, na ordem de criação. */
  readonly users: User[];
  /** Limpa os usuários persistidos entre os testes. */
  reset(): void;
}

/**
 * Repositório de usuários em memória que reproduz o índice único de e-mail do
 * MongoDB: duas criações com o mesmo e-mail (inclusive em requisições
 * simultâneas) resultam em `DuplicateEmailError`.
 */
export function createInMemoryUserRepository(): InMemoryUserRepository {
  const users: User[] = [];

  return {
    users,

    reset(): void {
      users.length = 0;
    },

    async findByEmail(email: string): Promise<User | null> {
      return users.find((user) => user.email === email.toLowerCase()) ?? null;
    },

    async create({ name, email, passwordHash }: CreateUserData): Promise<User> {
      if (users.some((user) => user.email === email.toLowerCase())) {
        throw new DuplicateEmailError();
      }

      const user: User = { id: `user-${users.length + 1}`, name, email, passwordHash };

      users.push(user);

      return user;
    },
  };
}

export function getCookieEntries(response: { headers: Record<string, unknown> }): string[] {
  const setCookie = response.headers["set-cookie"];

  if (!setCookie) {
    return [];
  }

  return Array.isArray(setCookie) ? setCookie : [String(setCookie)];
}

export function getCookieValue(
  response: { headers: Record<string, unknown> },
  name: string,
): string {
  const entry = getCookieEntries(response).find((header) => header.startsWith(`${name}=`));

  if (!entry) {
    throw new Error(`Cookie "${name}" não encontrado na resposta.`);
  }

  return entry.split(";")[0].slice(name.length + 1);
}
