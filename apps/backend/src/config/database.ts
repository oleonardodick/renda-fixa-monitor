import mongoose from "mongoose";
import type { EnvConfig } from "./env.js";

export async function connectDatabase(config: EnvConfig): Promise<void> {
  if (!config.mongodbUri) {
    throw new Error(
      "MONGODB_URI is required to connect to the database. Set it in .env or export it as an environment variable.",
    );
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(config.mongodbUri);

  if (process.env.NODE_ENV !== "test") {
    console.log(`Connected to MongoDB at ${config.mongodbUri}`);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();

  if (process.env.NODE_ENV !== "test") {
    console.log("Disconnected from MongoDB");
  }
}
