import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashBoardPage";
import AuditPage from "./pages/AuditPage";
import DepartamentosPage from "./pages/DepartamentosPage";
import PuestosPage from "./pages/PuestosPage";
import EmpleadosPage from "./pages/EmpleadosPage";
import ExpedienteEmpleadoPage from "./pages/ExpedienteEmpleadoPage";
import SucursalesPage from "./pages/SucursalesPage";
import IncidenciasPage from "./pages/IncidenciasPage";
import UsuariosPage from "./pages/UsuariosPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import NotFoundPage from "./pages/NotFoundPage";
import ChangePasswordRequiredPage from "./pages/ChangePasswordRequiredPage";
import ReclutamientoDashboardPage from "./pages/ReclutamientoDashboardPage";
import VacantesPage from "./pages/VacantesPage";
import CandidatosPage from "./pages/CandidatosPage";
import VacanteDetallePage from "./pages/VacanteDetallePage";
import CumpleaniosPage from "./pages/CumpleaniosPage";
import VacacionesImportacionPage from "./pages/VacacionesImportacionPage";
import VacacionesConciliacionPage from "./pages/VacacionesConciliacionPage";
import VacacionesSaldosReportePage from "./pages/VacacionesSaldosReportePage";
import VacacionesKardexReportePage from "./pages/VacacionesKardexReportePage";
import VacacionesDashboardPage from "./pages/VacacionesDashboardPage";
import VacacionesSolicitudesPage from "./pages/VacacionesSolicitudesPage";
import MiEquipoPage from "./pages/MiEquipoPage";

import RequireAuth from "./features/auth/RequireAuth";
import RoleGuard from "./features/auth/RoleGuard";
import { useAuth } from "./features/auth/AuthContext";

const DASHBOARD_ROLES = ["ADMIN", "RRHH", "JEFE", "CONSULTA", "EMPLEADO"];
const MI_EQUIPO_ROLES = ["ADMIN", "RRHH", "JEFE"];
const EMPLEADOS_ROLES = ["ADMIN", "RRHH", "JEFE", "CONSULTA"];
const INCIDENCIAS_ROLES = ["ADMIN", "RRHH", "JEFE", "EMPLEADO"];
const CUMPLEANIOS_ROLES = ["ADMIN", "RRHH", "JEFE", "CONSULTA", "EMPLEADO"];
const RECLUTAMIENTO_ROLES = ["ADMIN", "RRHH"];
const VACACIONES_ROLES = ["ADMIN", "RRHH"];

export default function App() {
  const { isAuthenticated, roles = [], mustChangePassword } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate
              to={mustChangePassword ? "/cambiar-password" : "/dashboard"}
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route path="/403" element={<ForbiddenPage />} />

      <Route
        path="/cambiar-password"
        element={
          <RequireAuth isAuthenticated={isAuthenticated}>
            <ChangePasswordRequiredPage />
          </RequireAuth>
        }
      />

      <Route
        element={
          <RequireAuth isAuthenticated={isAuthenticated}>
            {mustChangePassword ? (
              <Navigate to="/cambiar-password" replace />
            ) : (
              <AppShell />
            )}
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={DASHBOARD_ROLES}
            >
              <DashboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="mi-equipo"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={MI_EQUIPO_ROLES}
            >
              <MiEquipoPage />
            </RoleGuard>
          }
        />

        <Route
          path="usuarios"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={["ADMIN"]}
            >
              <UsuariosPage />
            </RoleGuard>
          }
        />

        <Route
          path="sucursales"
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
          path="audit"
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
          path="departamentos"
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
          path="puestos"
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
          path="empleados"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={EMPLEADOS_ROLES}
            >
              <EmpleadosPage />
            </RoleGuard>
          }
        />

        <Route
          path="empleados/:id/expediente"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={["ADMIN", "RRHH", "EMPLEADO"]}
            >
              <ExpedienteEmpleadoPage />
            </RoleGuard>
          }
        />

        <Route
          path="incidencias"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={INCIDENCIAS_ROLES}
            >
              <IncidenciasPage />
            </RoleGuard>
          }
        />

        <Route
          path="cumpleanios"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={CUMPLEANIOS_ROLES}
            >
              <CumpleaniosPage />
            </RoleGuard>
          }
        />

        <Route
          path="vacaciones"
          element={<Navigate to="/vacaciones/dashboard" replace />}
        />

        <Route
          path="vacaciones/dashboard"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={VACACIONES_ROLES}
            >
              <VacacionesDashboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="vacaciones/solicitudes"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={["ADMIN", "RRHH", "JEFE", "EMPLEADO"]}
            >
              <VacacionesSolicitudesPage />
            </RoleGuard>
          }
        />
        <Route
          path="vacaciones/conciliacion"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={VACACIONES_ROLES}
            >
              <VacacionesConciliacionPage />
            </RoleGuard>
          }
        />

        <Route
          path="vacaciones/importacion"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={VACACIONES_ROLES}
            >
              <VacacionesImportacionPage />
            </RoleGuard>
          }
        />

        <Route
          path="vacaciones/reportes/saldos"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={VACACIONES_ROLES}
            >
              <VacacionesSaldosReportePage />
            </RoleGuard>
          }
        />

        <Route
          path="vacaciones/reportes/kardex"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={VACACIONES_ROLES}
            >
              <VacacionesKardexReportePage />
            </RoleGuard>
          }
        />

        <Route
          path="reclutamiento"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={RECLUTAMIENTO_ROLES}
            >
              <ReclutamientoDashboardPage />
            </RoleGuard>
          }
        />

        <Route
          path="reclutamiento/vacantes"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={RECLUTAMIENTO_ROLES}
            >
              <VacantesPage />
            </RoleGuard>
          }
        />

        <Route
          path="reclutamiento/vacantes/:id"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={RECLUTAMIENTO_ROLES}
            >
              <VacanteDetallePage />
            </RoleGuard>
          }
        />

        <Route
          path="reclutamiento/candidatos"
          element={
            <RoleGuard
              isAuthenticated={isAuthenticated}
              userRoles={roles}
              allow={RECLUTAMIENTO_ROLES}
            >
              <CandidatosPage />
            </RoleGuard>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}