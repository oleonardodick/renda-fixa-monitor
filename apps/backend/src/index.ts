import { loadEnvConfig } from "./config/env.js";
import { buildServer } from "./server.js";

async function main() {
  const config = loadEnvConfig();
  const app = await buildServer();

  await app.listen({ port: config.port, host: config.host });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
