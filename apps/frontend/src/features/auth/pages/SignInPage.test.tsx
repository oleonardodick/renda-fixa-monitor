import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SignInPage } from "./SignInPage";

describe("SignInPage", () => {
  it("deve navegar para o cadastro ao clicar em Criar Conta", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<SignInPage />} />
          <Route path="/register" element={<p>register-page</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Não tem uma conta? Criar Conta" }));

    expect(screen.getByText("register-page")).toBeInTheDocument();
  });
});
