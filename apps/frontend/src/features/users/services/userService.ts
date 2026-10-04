import type { CreateUserInput, CreateUserResponse } from "@renda-fixa-monitor/shared";
import { api } from "@/lib/api";

/**
 * Cria um usuário e inicia a sessão.
 * O backend responde 201 com o ID do usuário e define os cookies de sessão.
 */
export async function createUser(input: CreateUserInput): Promise<CreateUserResponse> {
  const { data } = await api.post<CreateUserResponse>("/users", input);

  return data;
}
