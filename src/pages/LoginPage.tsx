import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginRequest } from "../api/auth.api";
import { useAuth } from "../features/auth/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginForm) => {
    try {
      setErrorMessage("");

      const data = await loginRequest(values);

      if (!data.accessToken) {
        throw new Error("La respuesta no contiene accessToken");
      }

      login(data.accessToken, data.refreshToken ?? null);
      navigate("/dashboard", { replace: true });
    } catch {
      setErrorMessage("Correo o contraseña incorrectos.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: { xs: 4, md: 6 },
        background:
          "radial-gradient(circle at top left, rgba(29,78,216,0.10) 0%, rgba(29,78,216,0.03) 28%, #f3f4f6 62%)",
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 480,
          borderRadius: "28px",
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.10)",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
          <Stack spacing={3}>
            <Box>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "18px",
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: alpha("#1d4ed8", 0.08),
                  color: "#1d4ed8",
                  border: `1px solid ${alpha("#1d4ed8", 0.12)}`,
                  mb: 2,
                }}
              >
                <ShieldRoundedIcon />
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.25 }}>
                <Chip
                  size="small"
                  label="GV RH"
                  variant="outlined"
                  sx={{
                    fontWeight: 800,
                    color: "#1d4ed8",
                    borderColor: alpha("#1d4ed8", 0.18),
                    backgroundColor: alpha("#1d4ed8", 0.05),
                  }}
                />
                <Chip
                  size="small"
                  label="Acceso interno"
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    borderColor: alpha("#0f172a", 0.10),
                    backgroundColor: alpha("#0f172a", 0.03),
                  }}
                />
              </Stack>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                }}
              >
                Iniciar sesión
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  mt: 1,
                  lineHeight: 1.6,
                }}
              >
                Ingresa con tu correo y contraseña para acceder al sistema de
                Recursos Humanos.
              </Typography>
            </Box>

            {errorMessage ? (
              <Alert severity="error" sx={{ borderRadius: "14px" }}>
                {errorMessage}
              </Alert>
            ) : null}

            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
              <TextField
                label="Correo"
                type="email"
                autoComplete="email"
                fullWidth
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailRoundedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                fullWidth
                {...register("password")}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRoundedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<LoginRoundedIcon />}
                disabled={isSubmitting}
                sx={{
                  mt: 0.5,
                  minHeight: 50,
                  fontWeight: 800,
                }}
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </Stack>

            <Box
              sx={{
                pt: 1,
                borderTop: `1px solid ${alpha("#0f172a", 0.06)}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.6,
                }}
              >
                Acceso restringido a usuarios autorizados. Toda actividad puede
                quedar registrada en la bitácora del sistema.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}