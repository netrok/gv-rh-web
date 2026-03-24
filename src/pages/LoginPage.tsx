import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../api/auth.api";
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
  return "No se pudo iniciar sesión.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      setSubmitting(true);

      const response = await loginRequest({
        email: email.trim(),
        password,
      });

      login({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
        mustChangePassword: response.mustChangePassword,
      });

      navigate(
        response.mustChangePassword ? "/cambiar-password" : "/dashboard",
        { replace: true }
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
      <Card sx={{ width: "100%", maxWidth: 460, borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="overline" sx={{ fontWeight: 800 }}>
                GV RH
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Iniciar sesión
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accede con tu cuenta corporativa.
              </Typography>
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <TextField
              label="Correo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              autoComplete="username"
            />

            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              autoComplete="current-password"
            />

            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}