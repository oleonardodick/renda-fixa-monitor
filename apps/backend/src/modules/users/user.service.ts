import type { CreateUserInput } from "@renda-fixa-monitor/shared";
import { DuplicateEmailError } from "../../errors/duplicate-email-error.js";
import type { IUserRepository } from "./user.repository.js";
import { createSession, type AuthServiceDeps, type SignInResult } from "../auth/auth.service.js";

export interface CreateUserServiceDeps {
  userRepository: IUserRepository;
  /** Hash da senha (bcrypt), injetado pela camada de HTTP. */
  hashPassword: (plain: string) => Promise<string>;
  /** Dependências de autenticação, para criar a sessão após o cadastro. */
  authService: AuthServiceDeps;
}

/**
 * Cria um usuário e já retorna a sessão correspondente.
 *
 * A sessão é criada pela mesma função usada na feature de Login, sem passar
 * pela rota HTTP de login. Em caso de e-mail já cadastrado, lança
 * `DuplicateEmailError` (409), inclusive quando a colisão ocorre entre
 * requisições simultâneas (índice único do banco).
 */
export async function createUser(
  deps: CreateUserServiceDeps,
  input: CreateUserInput,
): Promise<SignInResult> {
  const existingUser = await deps.userRepository.findByEmail(input.email);

  if (existingUser) {
    throw new DuplicateEmailError();
  }

  const passwordHash = await deps.hashPassword(input.password);
  const user = await deps.userRepository.create({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  return createSession(deps.authService, user);
}
