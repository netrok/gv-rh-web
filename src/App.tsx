import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashBoardPage";
import AuditPage from "./pages/AuditPage";
import DepartamentosPage from "./pages/DepartamentosPage";
import PuestosPage from "./pages/PuestosPage";
import EmpleadosPage from "./pages/EmpleadosPage";
import SucursalesPage from "./pages/SucursalesPage";
import RequireAuth from "./features/auth/RequireAuth";
import RoleGuard from "./features/auth/RoleGuard";
import ForbiddenPage from "./pages/ForbiddenPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuth } from "./features/auth/AuthContext";

export default function App() {
  const { isAuthenticated, roles = [] } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route
        element={
          <RequireAuth isAuthenticated={isAuthenticated}>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<DashboardPage />} />

        <Route
          path="/sucursales"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={["ADMIN", "RRHH"]}
            >
              <SucursalesPage />
            </RoleGuard>
          }
        />

        <Route
          path="/audit"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={["ADMIN", "RRHH"]}
            >
              <AuditPage />
            </RoleGuard>
          }
        />

        <Route
          path="/departamentos"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={["ADMIN", "RRHH"]}
            >
              <DepartamentosPage />
            </RoleGuard>
          }
        />

        <Route
          path="/puestos"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={["ADMIN", "RRHH"]}
            >
              <PuestosPage />
            </RoleGuard>
          }
        />

        <Route
          path="/empleados"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={["ADMIN", "RRHH"]}
            >
              <EmpleadosPage />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}