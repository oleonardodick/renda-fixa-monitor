/**
 * Indica que o limite de requisições da rota foi excedido.
 * Gerada pelo plugin de rate limiting e traduzida em 429 pelo handler global.
 */
export class RateLimitError extends Error {
  readonly statusCode = 429;

  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}
