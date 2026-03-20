import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

type AppPageProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * AppPage
 * -----------------------------------------------------------------------------
 * Propósito:
 * - Proveer una estructura estándar para cualquier página del sistema.
 * - Resolver de forma consistente:
 *   1) encabezado de página
 *   2) acciones superiores
 *   3) separación con el contenido principal
 *
 * Ajuste clave en esta versión:
 * - El body también se convierte en un contenedor con `display: grid` y `gap`.
 *
 * Razón:
 * - Antes, el gap del contenedor principal solo separaba:
 *   header <-> body
 * - Pero dentro del body, todos los bloques quedaban pegados entre sí porque
 *   el wrapper interno era un Box normal sin separación estructural.
 *
 * Resultado esperado:
 * - Hero, secciones, KPIs y bloques inferiores empiezan a respirar de verdad
 *   sin tener que meter márgenes manuales por toda la app.
 */
export default function AppPage({
  eyebrow = "Sistema interno",
  title,
  subtitle,
  actions,
  children,
}: AppPageProps) {
  return (
    <Box
      sx={{
        /**
         * Layout macro de la página:
         * separa el header del cuerpo principal.
         */
        display: "grid",
        gap: { xs: 3.5, md: 4.5 },
        minWidth: 0,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "flex-start" }}
        spacing={{ xs: 2, md: 2.75 }}
        sx={{
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              color: "text.secondary",
              fontWeight: 800,
              letterSpacing: "0.08em",
              lineHeight: 1.4,
              mb: 0.9,
            }}
          >
            {eyebrow}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              maxWidth: 900,
              textWrap: "balance",
            }}
          >
            {title}
          </Typography>

          {subtitle ? (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mt: 0.9,
                maxWidth: 920,
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {actions ? (
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              width: { xs: "100%", md: "auto" },
              minWidth: 0,
              pt: { xs: 0.25, md: 0 },
            }}
          >
            {actions}
          </Box>
        ) : null}
      </Stack>

      <Box
        sx={{
          /**
           * Aquí estaba el verdadero problema.
           *
           * Si este Box no tiene layout con gap, todos los bloques hijos
           * quedan apilados sin respiración estructural.
           *
           * Ahora:
           * - cada child directo de AppPage gana separación automática
           * - ya no dependes de meter `mt` manual por todos lados
           */
          minWidth: 0,
          display: "grid",
          gap: { xs: 2.75, md: 3.25 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}