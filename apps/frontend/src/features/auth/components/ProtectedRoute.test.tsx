import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { getSession } from "../services/authService";
import { useAuthStore } from "../stores/authStore";

vi.mock("../services/authService", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}));

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
  useAuthStore.setState({ status: "loading", userId: null });
});

describe("ProtectedRoute", () => {
  it("deve resolver a sessão e renderizar o conteúdo quando autenticado", async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: "user-1" });

    renderProtectedRoute();

    expect(await screen.findByText("conteudo-protegido")).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("deve redirecionar para o login quando não autenticado", async () => {
    vi.mocked(getSession).mockRejectedValue(new Error("Unauthorized"));

    renderProtectedRoute();

    expect(await screen.findByText("login-page")).toBeInTheDocument();
    expect(screen.queryByText("conteudo-protegido")).not.toBeInTheDocument();
  });

  it("deve exibir estado de carregamento enquanto a sessão não é resolvida", () => {
    vi.mocked(getSession).mockReturnValue(new Promise(() => {}));

    renderProtectedRoute();

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.queryByText("conteudo-protegido")).not.toBeInTheDocument();
  });
});