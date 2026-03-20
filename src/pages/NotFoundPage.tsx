import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
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
          "radial-gradient(circle at top left, rgba(29,78,216,0.08) 0%, rgba(29,78,216,0.02) 26%, #f3f4f6 62%)",
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
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "22px",
                display: "grid",
                placeItems: "center",
                backgroundColor: alpha("#1d4ed8", 0.08),
                color: "#1d4ed8",
                border: `1px solid ${alpha("#1d4ed8", 0.14)}`,
              }}
            >
              <SearchOffRoundedIcon sx={{ fontSize: 38 }} />
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
                label="404"
                variant="outlined"
                sx={{
                  fontWeight: 800,
                  color: "#1d4ed8",
                  borderColor: alpha("#1d4ed8", 0.20),
                  backgroundColor: alpha("#1d4ed8", 0.05),
                }}
              />
              <Chip
                size="small"
                label="Ruta no encontrada"
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  color: "#475569",
                  borderColor: alpha("#0f172a", 0.10),
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
                Página no encontrada
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  mt: 1.25,
                  maxWidth: 500,
                  lineHeight: 1.65,
                }}
              >
                La ruta que intentaste abrir no existe, cambió de dirección o ya
                no está disponible dentro del sistema.
              </Typography>
            </Box>

            <Box
              sx={{
                width: "100%",
                p: 2,
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
                <RouteRoundedIcon
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
                  Revisa la navegación del sistema o vuelve al dashboard para continuar.
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