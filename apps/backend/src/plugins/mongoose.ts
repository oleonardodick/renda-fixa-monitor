import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { loadEnvConfig } from "../config/env.js";

async function mongoosePlugin(app: FastifyInstance): Promise<void> {
  const config = loadEnvConfig();

  await connectDatabase(config);

  app.addHook("onClose", async () => {
    await disconnectDatabase();
  });
}

export default fp(mongoosePlugin, {
  name: "mongoose",
});
