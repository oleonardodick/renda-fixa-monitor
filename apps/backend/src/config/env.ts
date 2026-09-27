export interface EnvConfig {
  port: number;
  host: string;
  corsOrigin: string;
  mongodbUri: string | undefined;
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
}

export function loadEnvConfig(): EnvConfig {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET is required. Set it in .env or export it as an environment variable.",
    );
  }

  return {
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? "0.0.0.0",
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  };
}
