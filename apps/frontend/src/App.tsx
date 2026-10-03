import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { SignInPage } from "@/features/auth/pages/SignInPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<SignInPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;