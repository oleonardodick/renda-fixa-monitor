import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { loadEnvConfig } from "../config/env.js";

async function bcryptPlugin(fastify: FastifyInstance) {
  const config = loadEnvConfig();
  const saltRounds = config.bcryptSaltRounds;

  const bcryptDecorator = {
    hash(plain: string): Promise<string> {
      return bcrypt.hash(plain, saltRounds);
    },
    compare(plain: string, hashValue: string): Promise<boolean> {
      return bcrypt.compare(plain, hashValue);
    },
  };

  fastify.decorate("bcrypt", bcryptDecorator);
}

export default fp(bcryptPlugin, {
  name: "bcrypt",
});

export interface IBcryptPlugin {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashValue: string): Promise<boolean>;
}

declare module "fastify" {
  interface FastifyInstance {
    bcrypt: IBcryptPlugin;
  }
}
