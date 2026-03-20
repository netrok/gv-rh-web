import type { ReactNode } from "react";
import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * SectionCard
 * -----------------------------------------------------------------------------
 * Propósito:
 * - Servir como contenedor estándar para bloques grandes del sistema:
 *   tablas, filtros, formularios, listados y resúmenes.
 *
 * Qué debe resolver:
 * - Un encabezado claro y bien separado del contenido.
 * - Un cuerpo con padding suficiente para que la información respire.
 * - Un layout flexible para acciones a la derecha sin romper el bloque.
 *
 * Ajustes importantes en esta versión:
 * 1) Se mantiene eliminada la altura forzada (`height: 100%`).
 *    Razón:
 *    - En contenedores grid/flex esa regla puede estirar la card de más
 *      y generar espacios vacíos innecesarios.
 *
 * 2) Se aumenta el aire interno del header y del body.
 *    Razón:
 *    - Tras compactar la UI, varias secciones empezaron a verse demasiado juntas.
 *    - El espacio debe recuperarse aquí, de forma controlada, y no inflando
 *      arbitrariamente otros componentes.
 *
 * Regla visual:
 * - `SectionCard` debe crecer por contenido.
 * - Debe verse estructurada, limpia y sobria.
 * - No debe sentirse ni apretada ni inflada.
 */
export default function SectionCard({
  title,
  subtitle,
  actions,
  children,
}: SectionCardProps) {
  return (
    <Card
      sx={{
        /**
         * Sin altura forzada:
         * la tarjeta mide lo que realmente necesita según su contenido.
         */
        overflow: "hidden",
        backgroundImage: "none",
      }}
    >
      <CardContent
        sx={{
          /**
           * Se elimina el padding global del CardContent para controlar
           * por separado header y body.
           *
           * Beneficio:
           * - El Divider cae exactamente donde debe.
           * - El espaciado se vuelve más predecible.
           */
          p: 0,
          "&:last-child": {
            pb: 0,
          },
        }}
      >
        <Box
          sx={{
            /**
             * Header de sección.
             *
             * Ajuste:
             * - Se incrementa ligeramente el padding para dar más respiración,
             *   especialmente en desktop.
             */
            px: { xs: 2, md: 2.75 },
            py: { xs: 2, md: 2.5 },
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={{ xs: 1.5, sm: 2 }}
          >
            <Box
              sx={{
                /**
                 * minWidth: 0 evita que textos largos empujen de más al layout.
                 */
                minWidth: 0,
                flex: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  /**
                   * Título de sección:
                   * - fuerte
                   * - limpio
                   * - con jerarquía suficiente sin competir con títulos de página
                   */
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </Typography>

              {subtitle ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    /**
                     * El subtítulo aporta contexto.
                     * Se separa un poco más del título para evitar sensación de apretado.
                     */
                    mt: 0.6,
                    lineHeight: 1.5,
                    maxWidth: "90%",
                  }}
                >
                  {subtitle}
                </Typography>
              ) : null}
            </Box>

            {actions ? (
              <Box
                sx={{
                  /**
                   * Las acciones no deben comprimir el texto.
                   * En móvil se les da ancho completo para que respiren mejor.
                   */
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: { xs: "100%", sm: "auto" },
                  justifyContent: { xs: "flex-start", sm: "flex-end" },

                  /**
                   * Pequeña separación superior en móvil cuando el header cae en columna.
                   */
                  pt: { xs: 0.25, sm: 0 },
                }}
              >
                {actions}
              </Box>
            ) : null}
          </Stack>
        </Box>

        <Divider
          sx={{
            /**
             * Divider limpio y discreto.
             * Solo separa; no debe llamar atención.
             */
            mx: 0,
          }}
        />

        <Box
          sx={{
            /**
             * Body de la sección.
             *
             * Ajuste:
             * - Se incrementa el aire interno para que tablas, grids y formularios
             *   no se vean pegados al encabezado.
             */
            px: { xs: 2, md: 2.75 },
            py: { xs: 2, md: 2.5 },
          }}
        >
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}