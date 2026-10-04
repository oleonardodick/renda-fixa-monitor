export interface HealthResponse {
  status: "ok";
  timestamp: string;
}

export * from "./schemas/api-error.js";
export * from "./schemas/auth.js";
export * from "./schemas/user.js";
