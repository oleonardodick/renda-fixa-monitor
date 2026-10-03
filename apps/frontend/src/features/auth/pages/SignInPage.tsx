import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
          <div className="mt-3 text-center">
            <a
              href="#"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </a>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
