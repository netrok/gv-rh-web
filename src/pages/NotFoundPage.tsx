import { Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={0} sx={{ borderRadius: 4 }}>
        <CardContent sx={{ py: 6 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <SearchOffRoundedIcon sx={{ fontSize: 64 }} />

            <Typography variant="h4" fontWeight={800}>
              404
            </Typography>

            <Typography variant="h6" fontWeight={700}>
              Página no encontrada
            </Typography>

            <Typography color="text.secondary">
              La ruta que intentaste abrir no existe o ya cambió.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ pt: 1 }}
            >
              <Button variant="contained" onClick={() => navigate("/")}>
                Ir al inicio
              </Button>

              <Button variant="outlined" onClick={() => navigate(-1)}>
                Regresar
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}