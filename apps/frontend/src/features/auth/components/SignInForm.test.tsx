import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignInForm } from "./SignInForm";
import { signIn } from "../services/authService";
import { useAuthStore } from "../stores/authStore";

vi.mock("../services/authService", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}));

const CURRENT_USER = {
  id: "user-1",
  name: "Maria Oliveira",
  email: "maria.oliveira@example.com",
};

function renderSignInForm() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<SignInForm />} />
        <Route path="/dashboard" element={<p>dashboard-page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillCredentials(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  useAuthStore.setState({ status: "loading", user: null });
});

describe("SignInForm", () => {
  it("deve renderizar os campos de e-mail e senha com o botão Confirmar", () => {
    renderSignInForm();

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar" }),
    ).toBeInTheDocument();
  });

  it("deve exibir erro específico no campo quando o e-mail é inválido", async () => {
    renderSignInForm();
    fillCredentials("e-mail-invalido", "senha-123");

    expect(await screen.findByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("deve exibir erro específico no campo quando a senha está vazia", async () => {
    renderSignInForm();
    fillCredentials("maria.oliveira@example.com", "");

    expect(await screen.findByText("Informe sua senha.")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("deve iniciar a sessão, preencher o store e redirecionar para o dashboard após o login", async () => {
    vi.mocked(signIn).mockResolvedValue(CURRENT_USER);

    renderSignInForm();
    fillCredentials("maria.oliveira@example.com", "senha-123");

    await waitFor(() =>
      expect(screen.getByText("dashboard-page")).toBeInTheDocument(),
    );

    expect(signIn).toHaveBeenCalledWith({
      email: "maria.oliveira@example.com",
      password: "senha-123",
    });
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user).toEqual(CURRENT_USER);
  });

  it("não deve gravar os dados do usuário em localStorage ou sessionStorage", async () => {
    vi.mocked(signIn).mockResolvedValue(CURRENT_USER);

    renderSignInForm();
    fillCredentials("maria.oliveira@example.com", "senha-123");

    await waitFor(() =>
      expect(screen.getByText("dashboard-page")).toBeInTheDocument(),
    );

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("deve exibir mensagem genérica quando as credenciais são inválidas", async () => {
    vi.mocked(signIn).mockRejectedValue(
      Object.assign(new Error("Unauthorized"), {
        isAxiosError: true,
        response: { status: 401 },
      }),
    );

    renderSignInForm();
    fillCredentials("maria.oliveira@example.com", "senha-errada");

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("E-mail ou senha inválidos.");
    expect(useAuthStore.getState().status).not.toBe("authenticated");
  });

  it("deve exibir mensagem de falha de conexão quando o servidor não responde", async () => {
    vi.mocked(signIn).mockRejectedValue(new Error("Network Error"));

    renderSignInForm();
    fillCredentials("maria.oliveira@example.com", "senha-123");

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent(
      "Não foi possível conectar ao servidor. Tente novamente.",
    );
  });

  it("deve desabilitar o botão e indicar carregamento durante a autenticação", async () => {
    vi.mocked(signIn).mockReturnValue(new Promise(() => {}));

    renderSignInForm();
    fillCredentials("maria.oliveira@example.com", "senha-123");

    const button = await screen.findByRole("button", { name: "Entrando..." });

    expect(button).toBeDisabled();
  });
});