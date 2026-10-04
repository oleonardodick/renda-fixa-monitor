import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { useAuthStore } from "@/features/auth/stores/authStore";

/**
 * Página temporária: o Dashboard completo será criado em outra feature.
 * Serve como destino do redirecionamento após o login e abriga a ação "Sair".
 */
export function DashboardPage() {
  const userName = useAuthStore((state) => state.user?.name);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-semibold">Renda Fixa Monitor</span>
        <SignOutButton />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">
          Dashboard em construção. Você está autenticado
          {userName ? `, ${userName}` : ""}.
        </p>
      </main>
    </div>
  );
}