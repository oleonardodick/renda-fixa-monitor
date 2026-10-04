import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/features/auth/hooks/useSession";
import { Link, Navigate } from "react-router-dom";
import { SignUpForm } from "../components/SignUpForm";

/**
 * Página pública de cadastro.
 * Usuários já autenticados são redirecionados para o Dashboard.
 */
export function SignUpPage() {
  const { status, errorMessage } = useSession();

  if (status === "loading") {
    return (
      <main
        aria-busy="true"
        className="flex min-h-svh items-center justify-center bg-background p-4"
      >
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    );
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl">Criar Conta</CardTitle>
          <CardDescription>Crie sua conta para acompanhar seus investimentos.</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <SignUpForm />
          <div className="mt-3 text-center">
            <Link
              to="/login"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Já tem uma conta? Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
