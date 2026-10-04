import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { AppRouter } from "./router";
import { useAuthStore } from "@/features/auth/stores/authStore";

function renderRouter(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ status: "unauthenticated", userId: null });
});

describe("AppRouter", () => {
  it("deve renderizar a página de login em /login", () => {
    renderRouter("/login");

    expect(screen.getByText("Entrar")).toBeInTheDocument();
  });

  it("deve renderizar a página de cadastro em /register", () => {
    renderRouter("/register");

    expect(screen.getByRole("link", { name: "Já tem uma conta? Entrar" })).toBeInTheDocument();
  });

  it("deve renderizar o dashboard em /dashboard quando autenticado", () => {
    useAuthStore.setState({ status: "authenticated", userId: "user-1" });

    renderRouter("/dashboard");

    expect(screen.getByText(/Dashboard em construção/)).toBeInTheDocument();
  });

  it("deve redirecionar rotas desconhecidas para o dashboard", () => {
    useAuthStore.setState({ status: "authenticated", userId: "user-1" });

    renderRouter("/rota-inexistente");

    expect(screen.getByText(/Dashboard em construção/)).toBeInTheDocument();
  });

  it("deve redirecionar /dashboard para o login quando não autenticado", () => {
    renderRouter("/dashboard");

    expect(screen.getByText("Entrar")).toBeInTheDocument();
    expect(screen.queryByText(/Dashboard em construção/)).not.toBeInTheDocument();
  });
});
