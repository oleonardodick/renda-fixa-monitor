import { PieChart } from "lucide-react";
import { Link } from "react-router-dom";

interface BrandLogoProps {
  /** Callback opcional executado ao navegar (ex.: fechar o drawer). */
  onNavigate?: () => void;
}

export function BrandLogo({ onNavigate }: BrandLogoProps) {
  return (
    <Link
      to="/dashboard"
      onClick={onNavigate}
      aria-label="FGC Monitor — Dashboard"
      className="flex items-center gap-2"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground">
        <PieChart aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold text-foreground">Renda Fixa Monitor</span>
    </Link>
  );
}
