import {
  type ApiFieldError,
  type CreateUserResponse,
  createUserSchema,
} from "@renda-fixa-monitor/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodError } from "zod";
import { DuplicateEmailError } from "../../errors/duplicate-email-error.js";
import { setSessionCookies } from "../auth/auth.cookies.js";
import { createUser, type CreateUserServiceDeps } from "./user.service.js";

export interface UserHandlerDeps {
  createUserService: CreateUserServiceDeps;
  cookieSecure: boolean;
}

function toApiFieldErrors(error: ZodError): ApiFieldError[] {
  return error.issues.map((issue) => ({
    field: String(issue.path[0] ?? ""),
    message: issue.message,
  }));
}

export function createCreateUserHandler(deps: UserHandlerDeps) {
  return async function createUserHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const parsed = createUserSchema.safeParse(request.body);

    if (!parsed.success) {
      const errors = toApiFieldErrors(parsed.error);

      await reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: errors[0]?.message ?? "Dados inválidos.",
        errors,
      });
      return;
    }

    try {
      const session = await createUser(deps.createUserService, parsed.data);

      setSessionCookies(reply, session, deps.cookieSecure);

      await reply.status(201).send({ userId: session.userId } satisfies CreateUserResponse);
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        await reply.status(409).send({
          statusCode: 409,
          error: "Conflict",
          message: error.message,
          errors: [{ field: "email", message: error.message }],
        });
        return;
      }

      // Falhas inesperadas (banco indisponível, por exemplo) seguem para o
      // handler global, que responde 500 sem expor detalhes internos.
      throw error;
    }
  };
}
