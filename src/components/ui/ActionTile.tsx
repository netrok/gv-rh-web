import type { ReactNode } from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { alpha } from "@mui/material/styles";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

type ActionTileProps = {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  to: string;
};

/**
 * ActionTile
 * -----------------------------------------------------------------------------
 * Propósito:
 * - Representar un acceso rápido a un módulo o sección del sistema.
 * - Debe sentirse claramente clicable, pero con estética corporativa.
 *
 * Problemas del enfoque anterior:
 * 1) `borderRadius: 4` dentro de `sx` puede escalar con el theme y producir
 *    más redondeo del esperado.
 *
 * 2) Si el tile completo es demasiado redondo, pierde firmeza visual y entra
 *    en el mismo lenguaje "blando" del resto de la interfaz.
 *
 * 3) El icono, el texto y la flecha necesitan jerarquía:
 *    - icono = punto de entrada visual
 *    - título = primer nivel
 *    - subtítulo = contexto
 *    - flecha = señal clara de navegación
 *
 * Decisiones aplicadas:
 * - Tile con radio explícito en px para mantener control real.
 * - Hover con elevación moderada, borde más visible y ligero desplazamiento.
 * - Icono dentro de cápsula circular suave, pero el contenedor principal no
 *   se convierte en píldora.
 * - Flecha con transición para reforzar dirección y respuesta al hover.
 */
export default function ActionTile({
  title,
  subtitle,
  icon,
  to,
}: ActionTileProps) {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        /**
         * Radio explícito:
         * 18px da un look moderno y sólido.
         * Menos blando que una cápsula, pero todavía amable visualmente.
         */
        borderRadius: "18px",

        /**
         * El tile debe sentirse limpio y consistente con el sistema.
         */
        border: `1px solid ${alpha("#0f172a", 0.06)}`,
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
        backgroundImage: "none",
        overflow: "hidden",

        /**
         * Permite coordinar hover visual con elementos internos.
         */
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
      }}
    >
      <CardActionArea
        onClick={() => navigate(to)}
        sx={{
          /**
           * Se repite radio explícito para que el área interactiva respete
           * exactamente la forma del Card.
           */
          borderRadius: "18px",

          /**
           * Padding visual interno lo maneja CardContent,
           * pero aquí controlamos interacción y feedback.
           */
          transition: "background-color 180ms ease",

          /**
           * Hover general del tile:
           * - pequeña elevación
           * - borde más cercano al color primario
           * - sin exagerar movimiento
           */
          "&:hover": {
            backgroundColor: alpha("#1d4ed8", 0.02),
          },

          "&:hover .gv-action-tile-arrow": {
            transform: "translateX(3px)",
            color: "#1d4ed8",
          },

          "&:hover .gv-action-tile-icon": {
            backgroundColor: alpha("#1d4ed8", 0.10),
            borderColor: alpha("#1d4ed8", 0.18),
          },

          "&:hover .gv-action-tile-title": {
            color: "#0f172a",
          },

          /**
           * Focus visible:
           * crítico para accesibilidad con teclado.
           * Debe ser claro sin verse tosco.
           */
          "&.Mui-focusVisible": {
            outline: `3px solid ${alpha("#1d4ed8", 0.18)}`,
            outlineOffset: "-3px",
          },
        }}
      >
        <CardContent
          sx={{
            /**
             * Se compacta un poco para que el tile luzca ágil,
             * pero con suficiente aire para verse premium.
             */
            px: 2.25,
            py: 2,
            "&:last-child": {
              pb: 2,
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ minWidth: 0, flex: 1 }}
            >
              {icon ? (
                <Box
                  className="gv-action-tile-icon"
                  sx={{
                    /**
                     * El ícono sí puede vivir en una cápsula circular.
                     * Aquí funciona porque es un acento visual, no la estructura principal.
                     */
                    width: 42,
                    height: 42,
                    borderRadius: "14px",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha("#1d4ed8", 0.06),
                    color: "primary.main",
                    border: `1px solid ${alpha("#1d4ed8", 0.10)}`,
                    flexShrink: 0,
                    transition:
                      "background-color 180ms ease, border-color 180ms ease, transform 180ms ease",
                  }}
                >
                  {icon}
                </Box>
              ) : null}

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  className="gv-action-tile-title"
                  variant="subtitle1"
                  sx={{
                    /**
                     * Título con peso alto para lectura inmediata.
                     * Se cuida el overflow por si el texto es largo.
                     */
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.2,
                    transition: "color 180ms ease",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {title}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    /**
                     * El subtítulo acompaña, no compite.
                     * Se permite una sola línea para mantener tiles parejos.
                     */
                    mt: 0.35,
                    lineHeight: 1.35,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {subtitle}
                </Typography>
              </Box>
            </Stack>

            <ChevronRightRoundedIcon
              className="gv-action-tile-arrow"
              sx={{
                /**
                 * La flecha debe ser discreta en reposo
                 * y más viva al hover para reforzar la idea de navegación.
                 */
                color: alpha("#0f172a", 0.42),
                flexShrink: 0,
                transition: "transform 180ms ease, color 180ms ease",
              }}
            />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}