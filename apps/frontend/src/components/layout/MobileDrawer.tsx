import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useUIStore } from "../../store/useUIStore";
import { cn } from "cn";
import { BrandLogo } from "./BrandLogo";
import { NAVIGATION_ITEMS } from "@/routes/navigation";

export function MobileDrawer() {
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <>
      {/* Overlay: fecha o drawer ao clicar fora */}
      <div
        aria-hidden={!isMobileMenuOpen}
        onClick={closeMobileMenu}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="mobile-drawer"
        aria-label="Menu lateral de navegação"
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-card text-card-foreground shadow-2xl",
          "transition-transform duration-300",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <BrandLogo onNavigate={closeMobileMenu} />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeMobileMenu}
            aria-label="Fechar menu de navegação"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-card-foreground transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Menu de navegação" className="flex flex-col gap-1 px-2 py-6">
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
