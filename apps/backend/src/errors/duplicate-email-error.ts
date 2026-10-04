import { EMAIL_ALREADY_IN_USE_MESSAGE } from "@renda-fixa-monitor/shared";

/**
 * Indica que o e-mail informado já pertence a um usuário.
 * O cadastro informa explicitamente o conflito (409) para que ofrontend
 * exiba o erro no campo e-mail; a enumeração é mitigada pelo rate limiting.
 */
export class DuplicateEmailError extends Error {
  readonly statusCode = 409;

  constructor() {
    super(EMAIL_ALREADY_IN_USE_MESSAGE);
    this.name = "DuplicateEmailError";
  }
}
