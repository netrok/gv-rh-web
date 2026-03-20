import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

type MetricCardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string;
};

/**
 * MetricCard
 * -----------------------------------------------------------------------------
 * Propósito:
 * - Mostrar un KPI o dato clave del dashboard de forma rápida, clara y elegante.
 * - Debe destacar el valor principal sin competir visualmente con el HeroBanner.
 *
 * Qué debe lograr visualmente:
 * - Lectura inmediata del número.
 * - Buena respiración interna.
 * - Presencia suficiente para verse importante, sin volverse pesada.
 *
 * Ajustes importantes en esta versión:
 * 1) Se aumenta el padding interno.
 *    Razón:
 *    - Tras compactar la UI, las métricas empezaron a verse demasiado apretadas.
 *    - El KPI necesita aire para percibirse premium y no improvisado.
 *
 * 2) Se agrega `minHeight`.
 *    Razón:
 *    - Ayuda a que las tarjetas tengan una altura visual más estable.
 *    - Evita que se vean “chaparras” cuando el contenido es corto.
 *
 * 3) Se incrementa ligeramente la separación vertical entre título, valor
 *    y subtítulo.
 *    Razón:
 *    - El ojo debe distinguir mejor cada nivel de información.
 *
 * Regla visual:
 * - La tarjeta puede igualar altura dentro de grids de métricas.
 * - Aquí sí tiene sentido `height: 100%`, a diferencia de contenedores
 *   grandes tipo SectionCard.
 */
export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  badge,
}: MetricCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        /**
         * En métricas sí conviene permitir que la tarjeta ocupe toda la altura
         * disponible del grid para que el bloque se vea uniforme.
         */
        height: "100%",
        borderRadius: "20px",
        position: "relative",
        overflow: "hidden",

        /**
         * Borde y sombra sobrios:
         * suficiente separación del fondo sin parecer una tarjeta inflada.
         */
        border: `1px solid ${alpha("#0f172a", 0.06)}`,
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
        backgroundImage: "none",

        /**
         * Respuesta visual ligera para mantener sensación premium.
         */
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",

        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 16px 32px rgba(15, 23, 42, 0.08)",
          borderColor: alpha("#1d4ed8", 0.12),
        },

        /**
         * Acento superior:
         * da identidad a la métrica sin recargarla.
         */
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)",
        },
      }}
    >
      <CardContent
        sx={{
          /**
           * Padding interior más generoso.
           * Esto le devuelve respiración a la tarjeta sin desperdiciar espacio.
           */
          p: { xs: 2.25, md: 2.75 },

          /**
           * Altura mínima para que las métricas no se vean achatadas.
           * Mantiene mejor consistencia entre cards del mismo bloque.
           */
          minHeight: 152,

          "&:last-child": {
            pb: { xs: 2.25, md: 2.75 },
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                /**
                 * El título acompaña al KPI principal.
                 * Debe ser legible, pero no robar protagonismo.
                 */
                fontWeight: 600,
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                /**
                 * Valor principal:
                 * es el punto focal de la tarjeta.
                 */
                mt: 1.15,
                fontWeight: 900,
                color: "#0f172a",
                lineHeight: 1,
                letterSpacing: "-0.03em",
                fontSize: { xs: "1.85rem", md: "2rem" },
              }}
            >
              {value}
            </Typography>

            {subtitle ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  /**
                   * Subtítulo:
                   * ofrece contexto adicional sin competir con el número.
                   */
                  mt: 1.25,
                  lineHeight: 1.45,
                  maxWidth: "95%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>

          <Stack
            alignItems="flex-end"
            spacing={1.1}
            sx={{
              /**
               * El bloque derecho no debe deformar el ancho del contenido principal.
               */
              flexShrink: 0,
            }}
          >
            {badge ? (
              <Chip
                size="small"
                label={badge}
                variant="outlined"
                sx={{
                  /**
                   * El badge sí conserva lenguaje tipo cápsula,
                   * porque aquí funciona como etiqueta semántica.
                   */
                  fontWeight: 800,
                  color: "#1d4ed8",
                  borderColor: alpha("#1d4ed8", 0.18),
                  bgcolor: alpha("#1d4ed8", 0.05),
                }}
              />
            ) : null}

            {icon ? (
              <Box
                sx={{
                  /**
                   * Contenedor del icono:
                   * radio moderado para mantener firmeza visual.
                   */
                  width: 46,
                  height: 46,
                  borderRadius: "14px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#1d4ed8", 0.06),
                  color: alpha("#0f172a", 0.72),
                  border: `1px solid ${alpha("#1d4ed8", 0.10)}`,

                  /**
                   * Acabado sutil para que no se vea plano.
                   */
                  boxShadow: `inset 0 1px 0 ${alpha("#ffffff", 0.65)}`,
                }}
              >
                {icon}
              </Box>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}