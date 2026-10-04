import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/features/auth/hooks/useSession";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, errorMessage } = useSession();

  if (status === "loading") {
    return (
      <main aria-busy="true" className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    );
  }

  // Falha inesperada ao restaurar a sessão: informa o usuário sem desmontar a
  // aplicação nem exibir conteúdo protegido.
  if (errorMessage) {
    return (
      <main className="flex min-h-svh items-center justify-center p-4">
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
