import type { CurrentUser } from "@renda-fixa-monitor/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./authStore";

const USER: CurrentUser = {
  id: "user-1",
  name: "Maria Oliveira",
  email: "maria.oliveira@example.com",
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  useAuthStore.setState({ status: "loading", user: null });
});

describe("authStore", () => {
  it("deve iniciar sem usuário e com a sessão em carregamento", () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.status).toBe("loading");
  });

  it("deve preencher o usuário e marcar a sessão como autenticada", () => {
    useAuthStore.getState().setSession(USER);

    expect(useAuthStore.getState().user).toEqual(USER);
    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("deve esvaziar o usuário e marcar a sessão como não autenticada", () => {
    useAuthStore.getState().setSession(USER);
    useAuthStore.getState().clearSession();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("deve voltar ao estado de carregamento para resolver a sessão novamente", () => {
    useAuthStore.getState().setSession(USER);
    useAuthStore.getState().resetSession();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).toBe("loading");
  });

  it("não deve persistir os dados do usuário em localStorage ou sessionStorage", () => {
    useAuthStore.getState().setSession(USER);

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(JSON.stringify(localStorage)).not.toContain(USER.email);
    expect(JSON.stringify(sessionStorage)).not.toContain(USER.email);
  });
});
