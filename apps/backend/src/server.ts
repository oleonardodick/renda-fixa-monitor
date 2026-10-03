import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { type HealthResponse } from "@renda-fixa-monitor/shared";
import Fastify from "fastify";
import { loadEnvConfig } from "./config/env.js";
import { UnauthorizedError } from "./errors/unauthorized-error.js";
import { authenticate } from "./middlewares/auth.js";
import { createMongooseUserRepository, type IUserRepository } from "./repositories/user.repository.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import bcryptPlugin from "./plugins/bcrypt.js";
import jwtPlugin from "./plugins/jwt.js";
import mongoosePlugin from "./plugins/mongoose.js";
import scalarPlugin from "./plugins/scalar.js";
import swaggerPlugin from "./plugins/swagger.js";

export interface BuildServerOptions {
  /**
   * Whether to register the Mongoose plugin (connects to MongoDB).
   * Set to false for tests that don't need a database connection.
   * @default true
   */
  registerMongoose?: boolean;
  /**
   * Whether to register the storage plugin (loads the active storage provider).
   * Set to false for tests that don't need storage environment variables.
   * @default true
   */
  registerStorage?: boolean;
  /**
   * Substitui o repositório de usuários padrão (Mongoose).
   * Útil para injetar uma implementação falsa em testes.
   */
  userRepository?: IUserRepository;
}

export async function buildServer(options?: BuildServerOptions) {
  const { registerMongoose = true } = options ?? {};
  const config = loadEnvConfig();

  const app = Fastify({ logger: false });

  await app.register(cookie);
  await app.register(cors, {
    origin: config.corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  });

  await app.register(swaggerPlugin);
  await app.register(scalarPlugin);
  await app.register(jwtPlugin);
  await app.register(bcryptPlugin);

  if (registerMongoose) {
    await app.register(mongoosePlugin);
  }

  // Rotas sem `config.isPublic` exigem um access token válido (cookie ou header).
  app.addHook("onRequest", authenticate);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof UnauthorizedError) {
      return reply.status(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: error.message,
      });
    }

    console.error(error);

    return reply.status(500).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Erro interno do servidor.",
    });
  });

  const userRepository = options?.userRepository ?? createMongooseUserRepository();

  await app.register(authRoutes, { prefix: "/auth", userRepository });

  app.get(
    "/health",
    {
      schema: {
        tags: ["health"],
        description: "Verifica se a API está operacional.",
        summary: "Health check",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ok"] },
              timestamp: { type: "string", format: "date-time" },
            },
            required: ["status", "timestamp"],
          },
        },
      },
      config: {
        isPublic: true,
      },
    },
    async (): Promise<HealthResponse> => {
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
      };
    },
  );

  return app;
}
