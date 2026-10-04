import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { SignInForm } from "../components/SignInForm";

export function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl">Entrar</CardTitle>
          <CardDescription>Acesse sua conta para acompanhar seus investimentos.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
          <div className="mt-3 flex flex-col items-center gap-2">
            <a
              href="#"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </a>
            <Link
              to="/register"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Não tem uma conta? Criar Conta
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
