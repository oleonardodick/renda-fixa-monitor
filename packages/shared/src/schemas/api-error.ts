import { z } from "zod";

/**
 * Erro de validação associado a um campo específico do formulário.
 * O `field` corresponde ao nome do campo em `createUserSchema`.
 */
export const apiFieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export type ApiFieldError = z.infer<typeof apiFieldErrorSchema>;

/**
 * Envelope padrão de erro da API.
 * `message` traz o resumo do erro e `errors` detalha cada campo inválido.
 */
export const apiErrorResponseSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
  errors: z.array(apiFieldErrorSchema).optional(),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
