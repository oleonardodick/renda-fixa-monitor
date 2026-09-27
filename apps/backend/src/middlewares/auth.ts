import type { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyContextConfig {
    isPublic?: boolean;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  if (request.routeOptions.config.isPublic) {
    return;
  }

  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Token de autenticação inválido ou ausente.",
    });
  }
}
