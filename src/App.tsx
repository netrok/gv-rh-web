import { Navigate, Route, Routes } from "react-router";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AuditPage from "./pages/AuditPage";
import DepartamentosPage from "./pages/DepartamentosPage";
import PuestosPage from "./pages/PuestosPage";
import EmpleadosPage from "./pages/EmpleadosPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/departamentos" element={<DepartamentosPage />} />
        <Route path="/puestos" element={<PuestosPage />} />
        <Route path="/empleados" element={<EmpleadosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/audit" replace />} />
    </Routes>
  );
}