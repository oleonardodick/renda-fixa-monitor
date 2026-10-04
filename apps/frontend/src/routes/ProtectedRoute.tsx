import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/features/auth/hooks/useSession";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useSession();

  if (status === "loading") {
    return (
      <main aria-busy="true" className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
