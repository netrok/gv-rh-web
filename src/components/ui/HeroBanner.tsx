import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

type HeroBannerProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  aside?: ReactNode;
  actions?: ReactNode;
};

/**
 * HeroBanner
 * -----------------------------------------------------------------------------
 * Propósito:
 * - Servir como bloque principal de contexto para la pantalla.
 * - Presentar título, subtítulo, badge y un panel lateral opcional.
 *
 * Criterios visuales aplicados:
 * 1) Se evita el abuso de borderRadius tipo cápsula.
 *    En MUI, usar `borderRadius: 6` dentro de `sx` puede escalar con el tema.
 *    Si el theme base ya tiene borderRadius alto, el resultado se vuelve exagerado.
 *
 * 2) Se usan valores en px explícitos para este componente crítico.
 *    Razón:
 *    - Hace el resultado más predecible.
 *    - Evita que cambios futuros del tema descompongan el hero.
 *    - Mantiene una jerarquía visual clara frente a cards normales.
 *
 * 3) El hero debe verse premium y ejecutivo, no inflado.
 *    Por eso:
 *    - Radio firme, no extremo.
 *    - Sombra profunda pero controlada.
 *    - Borde interno sutil para dar definición.
 *    - Panel lateral translúcido con radio menor al bloque principal.
 */
export default function HeroBanner({
  eyebrow,
  title,
  subtitle,
  badge,
  aside,
  actions,
}: HeroBannerProps) {
  return (
    <Card
      sx={{
        /**
         * Importante:
         * Se usa valor en px para que el radio sea exacto.
         * 32px da presencia premium sin caer en forma de pastilla.
         */
        borderRadius: "32px",
        overflow: "hidden",

        /**
         * Gradiente oscuro corporativo.
         * Se mantiene sobrio para que el contenido blanco respire bien
         * y el bloque tenga autoridad visual.
         */
        background:
          "linear-gradient(135deg, #08152f 0%, #0d1d3d 42%, #14284a 100%)",
        color: "#ffffff",

        /**
         * Se elimina borde plano y se sustituye por un borde interno muy fino,
         * usando pseudo-elemento, para dar definición sin endurecer de más.
         */
        border: "none",

        /**
         * Sombra más seria:
         * - más profunda que una card normal
         * - sin verse borrosa o sucia
         */
        boxShadow: "0 24px 60px rgba(8, 21, 47, 0.22)",

        /**
         * position relative para permitir capa interna decorativa.
         */
        position: "relative",

        /**
         * Borde interno sutil:
         * mejora la lectura del contorno cuando el fondo general es claro.
         */
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          border: `1px solid ${alpha("#ffffff", 0.08)}`,
          pointerEvents: "none",
        },

        /**
         * Luz decorativa superior derecha:
         * aporta profundidad y acabado visual sin meter ruido.
         */
        "&::after": {
          content: '""',
          position: "absolute",
          width: 280,
          height: 280,
          top: -120,
          right: -80,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        },
      }}
    >
      <CardContent
        sx={{
          /**
           * Padding más generoso en desktop para que el hero respire como bloque principal.
           */
          p: { xs: 3, md: 4.25 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          spacing={{ xs: 3, md: 4 }}
          alignItems={{ xs: "stretch", lg: "flex-start" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {eyebrow ? (
              <Typography
                variant="overline"
                sx={{
                  /**
                   * Overline con contraste contenido.
                   * Debe acompañar, no competir con el título.
                   */
                  display: "inline-flex",
                  alignItems: "center",
                  letterSpacing: "0.12em",
                  color: alpha("#ffffff", 0.78),
                  fontWeight: 800,
                }}
              >
                {eyebrow}
              </Typography>
            ) : null}

            <Typography
              variant="h3"
              sx={{
                /**
                 * Título dominante del hero.
                 * Se usa tamaño responsive y tracking negativo moderado.
                 * Evitamos exagerar el letterSpacing negativo para no ensuciar la lectura.
                 */
                mt: 1,
                fontWeight: 900,
                fontSize: { xs: "2.2rem", md: "3.1rem" },
                lineHeight: 1.03,
                letterSpacing: "-0.035em",
                maxWidth: 820,
                textWrap: "balance",
              }}
            >
              {title}
            </Typography>

            {subtitle ? (
              <Typography
                variant="body1"
                sx={{
                  /**
                   * Subtítulo con contraste ligeramente menor al título.
                   * Eso mantiene jerarquía visual y mejora elegancia.
                   */
                  mt: 1.5,
                  color: alpha("#ffffff", 0.82),
                  maxWidth: 760,
                  fontSize: { xs: "0.97rem", md: "1rem" },
                }}
              >
                {subtitle}
              </Typography>
            ) : null}

            {(badge || actions) && (
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                sx={{ mt: 2.25 }}
              >
                {badge ? (
                  <Chip
                    label={badge}
                    size="small"
                    variant="outlined"
                    sx={{
                      /**
                       * El chip sí conserva lenguaje tipo cápsula.
                       * Aquí sí tiene sentido porque es una etiqueta semántica,
                       * no un contenedor estructural.
                       */
                      color: "#ffffff",
                      borderColor: alpha("#ffffff", 0.18),
                      bgcolor: alpha("#ffffff", 0.08),
                      fontWeight: 800,
                      backdropFilter: "blur(6px)",
                    }}
                  />
                ) : null}

                {actions}
              </Stack>
            )}
          </Box>

          {aside ? (
            <Box
              sx={{
                /**
                 * Panel lateral:
                 * - radio menor al hero principal para marcar subordinación visual
                 * - fondo translúcido para separarlo sin romper la unidad del bloque
                 */
                minWidth: { xs: "100%", lg: 280 },
                maxWidth: { xs: "100%", lg: 340 },
                p: { xs: 2.25, md: 2.5 },
                borderRadius: "24px",
                bgcolor: alpha("#ffffff", 0.08),
                border: `1px solid ${alpha("#ffffff", 0.12)}`,
                backdropFilter: "blur(10px)",

                /**
                 * Sombra interna muy leve:
                 * da sensación de panel contenido y mejora acabado premium.
                 */
                boxShadow: `inset 0 1px 0 ${alpha("#ffffff", 0.05)}`,
              }}
            >
              {aside}
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}