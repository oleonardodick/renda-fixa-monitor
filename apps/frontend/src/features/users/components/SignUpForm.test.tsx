import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpForm } from "./SignUpForm";
import { createUser } from "../services/userService";
import { useAuthStore } from "@/features/auth/stores/authStore";

vi.mock("../services/userService", () => ({
  createUser: vi.fn(),
}));

/** Erro de API no formato esperado pelo hook (envelope com erros por campo). */
function apiError(status: number, message: string, errors?: { field: string; message: string }[]) {
  return Object.assign(new Error("Request failed"), {
    isAxiosError: true,
    response: {
      status,
      data: { statusCode: status, error: "Error", message, errors },
    },
  });
}

function renderSignUpForm() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<SignUpForm />} />
        <Route path="/dashboard" element={<p>dashboard-page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillForm(values: {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}) {
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: values.name ?? "Maria Oliveira" },
  });
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: values.email ?? "maria.oliveira@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Senha"), {
    target: { value: values.password ?? "Senha@123" },
  });
  fireEvent.change(screen.getByLabelText("Confirmar senha"), {
    target: { value: values.confirmPassword ?? "Senha@123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Criar Conta" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ status: "unauthenticated", userId: null });
});

describe("SignUpForm", () => {
  it("deve renderizar os campos de cadastro com o botão Criar Conta", () => {
    renderSignUpForm();

    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar Conta" })).toBeInTheDocument();
  });

  it("deve exibir erro específico no campo quando o e-mail é inválido", async () => {
    renderSignUpForm();
    fillForm({ email: "e-mail-invalido" });

    expect(await screen.findByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("deve exibir erro específico no campo quando a senha é fraca", async () => {
    renderSignUpForm();
    fillForm({ password: "senha123", confirmPassword: "senha123" });

    expect(
      await screen.findByText(
        "A senha deve combinar pelo menos 3 destes requisitos: letra maiúscula, letra minúscula, número e caractere especial.",
      ),
    ).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("deve exibir erro no campo de confirmação quando as senhas divergem", async () => {
    renderSignUpForm();
    fillForm({ confirmPassword: "Outra@123" });

    expect(await screen.findByText("As senhas não coincidem.")).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("deve criar a conta, iniciar a sessão e redirecionar para o dashboard", async () => {
    vi.mocked(createUser).mockResolvedValue({ userId: "user-1" });

    renderSignUpForm();
    fillForm({});

    await waitFor(() => expect(screen.getByText("dashboard-page")).toBeInTheDocument());

    expect(createUser).toHaveBeenCalledWith({
      name: "Maria Oliveira",
      email: "maria.oliveira@example.com",
      password: "Senha@123",
      confirmPassword: "Senha@123",
    });
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().userId).toBe("user-1");
  });

  it("deve exibir no campo e-mail o erro 409 de e-mail já cadastrado", async () => {
    vi.mocked(createUser).mockRejectedValue(
      apiError(409, "Este e-mail já está cadastrado.", [
        { field: "email", message: "Este e-mail já está cadastrado." },
      ]),
    );

    renderSignUpForm();
    fillForm({});

    expect(await screen.findByText("Este e-mail já está cadastrado.")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
    expect(useAuthStore.getState().status).not.toBe("authenticated");
  });

  it("deve exibir no campo correspondente os erros 400 da API", async () => {
    vi.mocked(createUser).mockRejectedValue(
      apiError(400, "Informe um nome com pelo menos 3 caracteres.", [
        { field: "name", message: "Informe um nome com pelo menos 3 caracteres." },
      ]),
    );

    renderSignUpForm();
    fillForm({});

    expect(
      await screen.findByText("Informe um nome com pelo menos 3 caracteres."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveAttribute("aria-invalid", "true");
  });

  it("deve exibir mensagem genérica e limpar as senhas quando a requisição falha", async () => {
    vi.mocked(createUser).mockRejectedValue(new Error("Network Error"));

    renderSignUpForm();
    fillForm({});

    expect(
      await screen.findByText("Não foi possível criar a conta. Tente novamente."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Maria Oliveira");
    expect(screen.getByLabelText("E-mail")).toHaveValue("maria.oliveira@example.com");
    expect(screen.getByLabelText("Senha")).toHaveValue("");
    expect(screen.getByLabelText("Confirmar senha")).toHaveValue("");
  });

  it("deve desabilitar o botão e indicar carregamento durante o envio", async () => {
    vi.mocked(createUser).mockReturnValue(new Promise(() => {}));

    renderSignUpForm();
    fillForm({});

    const button = await screen.findByRole("button", { name: "Criando conta..." });

    expect(button).toBeDisabled();
  });
});
