import { Bell, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useUIStore } from "../../store/useUIStore";
import { cn } from "cn";
import { BrandLogo } from "./BrandLogo";
import { NAVIGATION_ITEMS } from "@/routes/navigation";

export function Header() {
  const { isMobileMenuOpen, toggleMobileMenu } = useUIStore();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo />

        <nav aria-label="Navegação principal" className="hidden flex-1 md:flex">
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                cn(
                  "flex h-full items-center border-b-2 px-4 text-sm font-medium transition-colors",
                  isActive
                    ? "border-brand text-foreground"
                    : "border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Versão desktop do header */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              aria-label="Notificações"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Bell aria-hidden="true" className="h-5 w-5" />
              <span
                aria-hidden="true"
                className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive"
              />
            </button>
          </div>

          {/* Versão Mobile do Header */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-drawer"
              aria-label="Abrir menu de navegação"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Menu aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
