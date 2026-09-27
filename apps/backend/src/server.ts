import cors from "@fastify/cors";
import { type HealthResponse } from "@renda-fixa-monitor/shared";
import Fastify from "fastify";
import { loadEnvConfig } from "./config/env.js";
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
}

export async function buildServer(options?: BuildServerOptions) {
  const { registerMongoose = true } = options ?? {};
  const config = loadEnvConfig();

  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: config.corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  await app.register(swaggerPlugin);
  await app.register(scalarPlugin);
  await app.register(jwtPlugin);
  await app.register(bcryptPlugin);

  if (registerMongoose) {
    await app.register(mongoosePlugin);
  }

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
