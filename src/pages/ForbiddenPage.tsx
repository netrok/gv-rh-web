import { Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import { useNavigate } from "react-router-dom";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={0} sx={{ borderRadius: 4 }}>
        <CardContent sx={{ py: 6 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <BlockRoundedIcon sx={{ fontSize: 64 }} />
            <Typography variant="h4" fontWeight={800}>
              403
            </Typography>

            <Typography variant="h6" fontWeight={700}>
              No tienes permiso para entrar aquí
            </Typography>

            <Typography color="text.secondary">
              Tu usuario no cuenta con los permisos requeridos para esta sección.
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