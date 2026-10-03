import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { loadEnvConfig } from "../src/config/env.js";
import { UserModel } from "../src/models/user.model.js";

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function main(): Promise<void> {
  const email = readArg("email");
  const password = readArg("password");
  const name = readArg("name") ?? "Usuário";

  if (!email || !password) {
    console.error(
      "Uso: pnpm seed:user -- --email <email> --password <senha> [--name <nome>]",
    );
    process.exit(1);
  }

  const config = loadEnvConfig();

  if (!config.mongodbUri) {
    throw new Error(
      "MONGODB_URI é obrigatório para criar o usuário. Configure-o no .env.",
    );
  }

  await mongoose.connect(config.mongodbUri);

  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

  await UserModel.updateOne(
    { email: normalizedEmail },
    { $set: { email: normalizedEmail, name, passwordHash } },
    { upsert: true },
  );

  console.log(`Usuário ${normalizedEmail} criado/atualizado com sucesso.`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});