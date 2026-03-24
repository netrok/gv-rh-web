import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { changePasswordRequest } from "../api/auth.api";
import { useAuth } from "../features/auth/AuthContext";

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    const message = response?.data?.message;
    if (message) return message;
  }

  if (error instanceof Error) return error.message;
  return "No se pudo cambiar la contraseña.";
}

export default function ChangePasswordRequiredPage() {
  const navigate = useNavigate();
  const { user, mustChangePassword, markPasswordChanged, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const current = currentPassword.trim();
    const next = newPassword.trim();
    const confirm = confirmNewPassword.trim();

    if (!current) {
      setError("La contraseña actual es obligatoria.");
      return;
    }

    if (next.length < 10) {
      setError("La nueva contraseña debe tener al menos 10 caracteres.");
      return;
    }

    if (next !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setSubmitting(true);

      await changePasswordRequest({
        currentPassword: current,
        newPassword: next,
      });

      markPasswordChanged();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
      <Card sx={{ width: "100%", maxWidth: 560, borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="overline" sx={{ fontWeight: 800 }}>
                SEGURIDAD
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Debes cambiar tu contraseña
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email
                  ? `La cuenta ${user.email} tiene una contraseña temporal.`
                  : "Tu cuenta tiene una contraseña temporal."}
              </Typography>
            </Box>

            {mustChangePassword ? (
              <Alert severity="warning">
                No podrás usar el sistema hasta definir una contraseña nueva.
              </Alert>
            ) : null}

            {error ? <Alert severity="error">{error}</Alert> : null}

            <TextField
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              autoComplete="current-password"
            />

            <TextField
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
              helperText="Mínimo 10 caracteres."
            />

            <TextField
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Guardando..." : "Cambiar contraseña"}
              </Button>

              <Button
                type="button"
                variant="outlined"
                color="inherit"
                onClick={() => void logout()}
                disabled={submitting}
              >
                Cerrar sesión
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}