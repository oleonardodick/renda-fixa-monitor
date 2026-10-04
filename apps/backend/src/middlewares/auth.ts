import { UNAUTHENTICATED_MESSAGE } from "../modules/auth/auth.constants.js";
import type { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyContextConfig {
    isPublic?: boolean;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  // Rotas não registradas (404) e rotas públicas não exigem autenticação.
  if (request.routeOptions.config.isPublic || request.routeOptions.url == null) {
    return;
  }

  try {
    await request.accessJwtVerify();
  } catch {
    return reply.status(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: UNAUTHENTICATED_MESSAGE,
    });
  }
}
