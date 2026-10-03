import { Button } from "@/components/ui/button";
import { useSignOut } from "../hooks/useSignOut";

export function SignOutButton() {
  const { handleSignOut, isPending } = useSignOut();

  return (
    <Button type="button" variant="outline" onClick={handleSignOut} disabled={isPending}>
      {isPending ? "Saindo..." : "Sair"}
    </Button>
  );
}