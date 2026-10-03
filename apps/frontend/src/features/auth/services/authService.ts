import {
  type AuthMeResponse,
  type SignInInput,
  type SignInResponse,
} from "@renda-fixa-monitor/shared";
import { api } from "@/lib/api";

export async function signIn(input: SignInInput): Promise<SignInResponse> {
  const { data } = await api.post<SignInResponse>("/auth/login", input);

  return data;
}

export async function signOut(): Promise<void> {
  await api.post("/auth/logout");
}

export async function getSession(): Promise<AuthMeResponse> {
  const { data } = await api.get<AuthMeResponse>("/auth/me");

  return data;
}