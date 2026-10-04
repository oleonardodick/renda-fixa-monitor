import { type CurrentUser, type SignInInput } from "@renda-fixa-monitor/shared";
import { UnauthorizedError } from "../../errors/unauthorized-error.js";
import { toCurrentUser } from "../users/user.mapper.js";
import type { IUserRepository, User } from "../users/user.repository.js";
import { INVALID_CREDENTIALS_MESSAGE } from "./auth.constants.js";

/** Payload mínimo exigido nos tokens de sessão. */
export interface AuthTokenPayload {
  /** ID do usuário (claim padrão `sub`). */
  sub: string;
  email: string;
}

/** Assinatura dos tokens de sessão, injetada pela camada de HTTP. */
export interface TokenSigner {
  signAccessToken(payload: AuthTokenPayload): string;
  signRefreshToken(payload: AuthTokenPayload): string;
}

export interface AuthServiceDeps {
  userRepository: IUserRepository;
  comparePassword: (plain: string, hash: string) => Promise<boolean>;
  tokenSigner: TokenSigner;
}

export interface SignInResult {
  /** Dados públicos do usuário autenticado, limitados à allowlist da API. */
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Hash fictício (de "dummy-password-for-timing-equalization") usado quando o
 * e-mail não existe. Mantém o tempo de resposta semelhante entre as falhas de
 * e-mail inexistente e senha incorreta, dificultando a enumeração de usuários.
 */
const DUMMY_PASSWORD_HASH = "$2b$10$kmTuYlbaw/SYwdM0.rGpEeglfPbvzLjrD6xPw/p4eOaFYnqK6osUK";

/**
 * Cria os tokens de sessão de um usuário já autenticado.
 *
 * É a única origem de sessão do sistema e é reutilizada pela feature de Login
 * e pelo cadastro de usuário, garantindo tokens e cookies idênticos.
 */
export function createSession(deps: AuthServiceDeps, user: User): SignInResult {
  const payload: AuthTokenPayload = { sub: user.id, email: user.email };

  return {
    user: toCurrentUser(user),
    accessToken: deps.tokenSigner.signAccessToken(payload),
    refreshToken: deps.tokenSigner.signRefreshToken(payload),
  };
}

export async function signIn(
  deps: AuthServiceDeps,
  credentials: SignInInput,
): Promise<SignInResult> {
  const user = await deps.userRepository.findByEmail(credentials.email);
  const passwordMatches = await deps.comparePassword(
    credentials.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
  }

  return createSession(deps, user);
}
