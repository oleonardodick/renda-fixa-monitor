import type { CurrentUser } from "@renda-fixa-monitor/shared";
import type { User } from "./user.repository.js";

/**
 * Converte a representação de domínio de um usuário nos dados públicos
 * expostos pela API.
 *
 * A allowlist é explícita: apenas `id`, `name` e `email` são selecionados.
 * `passwordHash` e qualquer outro campo interno jamais fazem parte do
 * resultado, em vez de serem removidos depois.
 */
export function toCurrentUser(user: User): CurrentUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
