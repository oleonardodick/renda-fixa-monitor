import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { SignInPage } from "@/features/auth/pages/SignInPage";
import { SignUpPage } from "@/features/users/pages/SignUpPage";
import { NAVIGATION_ITEMS } from "./navigation";

/**
 * Configuração de rotas da aplicação.
 *
 * As rotas protegidas são geradas a partir dos itens de navegação,
 * mantendo a definição das páginas centralizada em `navigation.tsx`.
 *
 * Todas elas são aninhadas em uma rota de layout sem `path`, protegida por
 * `ProtectedRoute` e renderizada dentro de `AppLayout`, que provide o
 * cabeçalho, o menu lateral e o `Outlet` usado pelas páginas.
 * As rotas públicas ficam fora do layout para não exibir a casca da aplicação.
 */
export function AppRouter() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<SignInPage />} />
      <Route path="/register" element={<SignUpPage />} />

      {/* Rotas protegidas, aninhadas no layout da aplicação */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {NAVIGATION_ITEMS.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
