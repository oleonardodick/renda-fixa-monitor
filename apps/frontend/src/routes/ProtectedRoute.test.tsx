import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { getSession } from "@/features/auth/services/authService";
import { useAuthStore } from "@/features/auth/stores/authStore";

vi.mock("@/features/auth/services/authService", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}));

const CURRENT_USER = {
  id: "user-1",
  name: "Maria Oliveira",
  email: "maria.oliveira@example.com",
};

/** Erro de API no formato do axios, usado para simular respostas da API. */
function apiError(status: number) {
  return Object.assign(new Error("Request failed"), {
    isAxiosError: true,
    response: { status },
  });
}

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <p>conteudo-protegido</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<p>login-page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  useAuthStore.setState({ status: "loading", user: null });
});

describe("ProtectedRoute", () => {
  it("deve restaurar o usuário da sessão e renderizar o conteúdo quando autenticado", async () => {
    vi.mocked(getSession).mockResolvedValue(CURRENT_USER);

    renderProtectedRoute();

    expect(await screen.findByText("conteudo-protegido")).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user).toEqual(CURRENT_USER);
  });

  it("não deve persistir o usuário restaurado em localStorage ou sessionStorage", async () => {
    vi.mocked(getSession).mockResolvedValue(CURRENT_USER);

    renderProtectedRoute();

    expect(await screen.findByText("conteudo-protegido")).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("deve redirecionar para o login quando não autenticado", async () => {
    vi.mocked(getSession).mockRejectedValue(apiError(401));

    renderProtectedRoute();

    expect(await screen.findByText("login-page")).toBeInTheDocument();
    expect(screen.queryByText("conteudo-protegido")).not.toBeInTheDocument();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("deve exibir mensagem genérica quando a restauração falha por erro de servidor", async () => {
    vi.mocked(getSession).mockRejectedValue(apiError(500));

    renderProtectedRoute();

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("Não foi possível carregar seus dados. Tente novamente.");
    expect(useAuthStore.getState().user).toBeNull();
    expect(screen.queryByText("conteudo-protegido")).not.toBeInTheDocument();
  });

  it("deve exibir mensagem genérica quando a restauração falha por erro de rede", async () => {
    vi.mocked(getSession).mockRejectedValue(new Error("Network Error"));

    renderProtectedRoute();

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("Não foi possível carregar seus dados. Tente novamente.");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("deve exibir estado de carregamento enquanto a sessão não é resolvida", () => {
    vi.mocked(getSession).mockReturnValue(new Promise(() => {}));

    renderProtectedRoute();

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.queryByText("conteudo-protegido")).not.toBeInTheDocument();
  });
});
