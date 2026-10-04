import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpPage } from "./SignUpPage";
import { getSession } from "@/features/auth/services/authService";
import { useAuthStore } from "@/features/auth/stores/authStore";

vi.mock("@/features/auth/services/authService", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}));

function renderSignUpPage() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<SignUpPage />} />
        <Route path="/dashboard" element={<p>dashboard-page</p>} />
        <Route path="/login" element={<p>login-page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ status: "unauthenticated", user: null });
});

describe("SignUpPage", () => {
  it("deve redirecionar para o dashboard quando o usuário já está autenticado", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        id: "user-1",
        name: "Maria Oliveira",
        email: "maria.oliveira@example.com",
      },
    });

    renderSignUpPage();

    expect(screen.getByText("dashboard-page")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("deve exibir o formulário de cadastro quando não há sessão", () => {
    renderSignUpPage();

    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar Conta" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Já tem uma conta? Entrar" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("deve exibir estado de carregamento enquanto a sessão é resolvida", () => {
    vi.mocked(getSession).mockReturnValue(new Promise(() => {}));
    useAuthStore.setState({ status: "loading", user: null });

    renderSignUpPage();

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("deve informar quando a sessão não pode ser restaurada", async () => {
    vi.mocked(getSession).mockRejectedValue(new Error("Network Error"));
    useAuthStore.setState({ status: "loading", user: null });

    renderSignUpPage();

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("Não foi possível carregar seus dados. Tente novamente.");
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
  });
});
