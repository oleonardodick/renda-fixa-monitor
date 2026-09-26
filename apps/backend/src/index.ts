import Fastify from "fastify";

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  return {
    status: "ok",
  };
});

const start = async () => {
  await app.listen({
    port: 3000,
    host: "0.0.0.0",
  });
};

start();