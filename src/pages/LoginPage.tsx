import {
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../api/axios";
import { useAuth } from "./../features/auth/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string>("");

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
      const { data } = await api.post("/api/auth/login", values);

      const token = data.accessToken;
      if (!token) {
        throw new Error("La respuesta no contiene accessToken");
      }

      login(token);
      window.location.href = "/audit";
    } catch {
      setErrorMessage("No se pudo iniciar sesión.");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            GV RH
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }} color="text.secondary">
            Iniciar sesión
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label="Correo"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              label="Contraseña"
              type="password"
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Entrar
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}