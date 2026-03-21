import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { useNavigate } from "react-router-dom";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: { xs: 4, md: 6 },
        background:
          "radial-gradient(circle at top left, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.02) 24%, #f5f7fb 62%)",
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 620,
          borderRadius: "28px",
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.10)",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        <CardContent
          sx={{
            p: { xs: 3, md: 5 },
            "&:last-child": {
              pb: { xs: 3, md: 5 },
            },
          }}
        >
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "22px",
                display: "grid",
                placeItems: "center",
                backgroundColor: alpha("#dc2626", 0.08),
                color: "#dc2626",
                border: `1px solid ${alpha("#dc2626", 0.14)}`,
              }}
            >
              <BlockRoundedIcon sx={{ fontSize: 38 }} />
            </Box>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              justifyContent="center"
            >
              <Chip
                size="small"
                label="403"
                variant="outlined"
                sx={{
                  fontWeight: 800,
                  color: "#dc2626",
                  borderColor: alpha("#dc2626", 0.2),
                  backgroundColor: alpha("#dc2626", 0.05),
                }}
              />
              <Chip
                size="small"
                label="Acceso restringido"
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  color: "#475569",
                  borderColor: alpha("#0f172a", 0.1),
                  backgroundColor: alpha("#0f172a", 0.03),
                }}
              />
            </Stack>

            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.06,
                  letterSpacing: "-0.03em",
                }}
              >
                No tienes permiso para entrar aquí
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  mt: 1.25,
                  maxWidth: 520,
                  lineHeight: 1.65,
                }}
              >
                Tu usuario no cuenta con los permisos requeridos para esta
                sección. Si crees que esto es un error, revisa tus roles o
                solicita acceso con el administrador del sistema.
              </Typography>
            </Box>

            <Box
              sx={{
                width: "100%",
                px: 2,
                py: 2,
                borderRadius: "18px",
                border: `1px solid ${alpha("#0f172a", 0.06)}`,
                backgroundColor: alpha("#0f172a", 0.025),
              }}
            >
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                justifyContent="center"
              >
                <ShieldRoundedIcon
                  fontSize="small"
                  sx={{ color: "#64748b", flexShrink: 0 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  Esta pantalla protege módulos internos con control por roles y
                  permisos.
                </Typography>
              </Stack>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ pt: 0.5, width: "100%" }}
              justifyContent="center"
            >
              <Button
                variant="contained"
                startIcon={<HomeRoundedIcon />}
                onClick={() => navigate("/dashboard")}
                sx={{ minWidth: 160, fontWeight: 800 }}
              >
                Ir al dashboard
              </Button>

              <Button
                variant="outlined"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate(-1)}
                sx={{ minWidth: 160, fontWeight: 800 }}
              >
                Regresar
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}