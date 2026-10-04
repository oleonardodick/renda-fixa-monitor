import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "./SignOutButton";
import { signOut } from "../services/authService";
import { useAuthStore } from "../stores/authStore";

vi.mock("../services/authService", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}));

function renderSignOutButton() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<SignOutButton />} />
        <Route path="/login" element={<p>login-page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const CURRENT_USER = {
  id: "user-1",
  name: "Maria Oliveira",
  email: "maria.oliveira@example.com",
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ status: "authenticated", user: CURRENT_USER });
});

describe("SignOutButton", () => {
  it("deve encerrar a sessão, limpar o estado e redirecionar para o login", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined);

    renderSignOutButton();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() =>
      expect(screen.getByText("login-page")).toBeInTheDocument(),
    );

    expect(signOut).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("deve encerrar a sessão local mesmo quando a chamada ao servidor falha", async () => {
    vi.mocked(signOut).mockRejectedValue(new Error("Network Error"));

    renderSignOutButton();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() =>
      expect(screen.getByText("login-page")).toBeInTheDocument(),
    );

    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });
});