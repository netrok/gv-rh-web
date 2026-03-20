import { alpha, createTheme } from "@mui/material/styles";

/**
 * GV RH Theme
 * -----------------------------------------------------------------------------
 * Objetivo visual:
 * - Darle al sistema una estética más ejecutiva y sólida.
 * - Reducir la sensación "blanda" causada por el exceso de bordes totalmente redondos.
 * - Mantener modernidad sin caer en un look juguetón o demasiado informal.
 *
 * Decisión principal:
 * - Ya no se usa el mismo nivel de redondeado para todo.
 * - Se define una jerarquía visual:
 *
 *   1) Contenedores grandes (Card / Paper / secciones): radio medio-alto pero firme.
 *   2) Controles interactivos (Button / Input): radio moderado.
 *   3) Chips / badges: pill completo, porque ahí sí tiene sentido semántico y visual.
 *
 * Esto mejora la jerarquía, el contraste entre componentes y hace que el dashboard
 * se perciba más "producto serio" que "interfaz inflada".
 */
export const gvRhTheme = createTheme({
  palette: {
    mode: "light",

    /**
     * Azul principal:
     * - Conserva identidad corporativa.
     * - Funciona bien para acciones primarias, acentos y estados focus.
     */
    primary: {
      main: "#1d4ed8",
    },

    /**
     * Secundario oscuro:
     * - Útil para textos potentes, fondos ejecutivos y contraste general.
     */
    secondary: {
      main: "#0f172a",
    },

    background: {
      /**
       * Se baja un poco el blanco puro del fondo general.
       * Eso ayuda a que las cards blancas respiren y destaquen mejor.
       */
      default: "#f1f5f9",
      paper: "#ffffff",
    },

    text: {
      /**
       * Un gris muy oscuro funciona mejor que negro absoluto:
       * se ve fino, profesional y menos agresivo visualmente.
       */
      primary: "#111827",
      secondary: "#64748b",
    },

    /**
     * El divisor ligeramente frío combina mejor con el azul principal
     * y con un lenguaje visual más corporativo.
     */
    divider: "#e2e8f0",
  },

  /**
   * Radio base del sistema.
   * Ojo: esto NO significa que todo vaya con 18.
   * Solo marca una referencia global razonable.
   *
   * Luego cada componente crítico se ajusta de forma explícita
   * para evitar que todo se vea igual.
   */
  shape: {
    borderRadius: 18,
  },

  typography: {
    fontFamily: [
      "Inter",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "sans-serif",
    ].join(","),

    /**
     * Encabezados:
     * - Se mantienen con bastante peso porque el dashboard necesita autoridad visual.
     * - El tracking negativo ayuda a que luzcan compactos y contemporáneos.
     */
    h1: {
      fontSize: "2.8rem",
      fontWeight: 900,
      lineHeight: 1.05,
      letterSpacing: "-0.04em",
    },
    h2: {
      fontSize: "2.2rem",
      fontWeight: 900,
      lineHeight: 1.08,
      letterSpacing: "-0.03em",
    },
    h3: {
      fontSize: "1.9rem",
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontSize: "1.55rem",
      fontWeight: 800,
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 800,
      lineHeight: 1.2,
    },
    h6: {
      fontSize: "1.05rem",
      fontWeight: 800,
      lineHeight: 1.25,
    },

    /**
     * Subtítulos:
     * - Tienen suficiente peso para ayudar a jerarquía interna
     *   sin competir con títulos principales.
     */
    subtitle1: {
      fontSize: "0.98rem",
      fontWeight: 700,
      lineHeight: 1.35,
    },
    subtitle2: {
      fontSize: "0.88rem",
      fontWeight: 700,
      lineHeight: 1.35,
    },

    /**
     * Texto base:
     * - Ligero ajuste a line-height para una lectura limpia en paneles y tablas.
     */
    body1: {
      fontSize: "0.95rem",
      lineHeight: 1.55,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },

    /**
     * Botones:
     * - Se evita mayúscula automática porque el producto se ve más refinado.
     * - Peso alto para mantener sensación de acción clara.
     */
    button: {
      textTransform: "none",
      fontWeight: 700,
      fontSize: "0.92rem",
      letterSpacing: "-0.01em",
    },

    caption: {
      fontSize: "0.78rem",
      lineHeight: 1.4,
    },

    /**
     * Overline muy útil para etiquetas de sección, módulos o headers compactos.
     */
    overline: {
      fontSize: "0.72rem",
      fontWeight: 800,
      letterSpacing: "0.08em",
      lineHeight: 1.4,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        /**
         * Se asegura consistencia de layout en todo el árbol.
         */
        "*": {
          boxSizing: "border-box",
        },

        body: {
          backgroundColor: "#f1f5f9",
          color: "#111827",

          /**
           * Font smoothing mejora ligeramente la percepción tipográfica
           * en interfaces modernas.
           */
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },

        /**
         * Selección de texto discreta y coherente con la marca.
         */
        "::selection": {
          backgroundColor: alpha("#1d4ed8", 0.18),
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          /**
           * En vez de una barra "pesada", se usa una barra limpia,
           * con borde inferior sutil. Da estructura sin ensuciar.
           */
          boxShadow: "none",
          backgroundImage: "none",
          borderBottom: `1px solid ${alpha("#0f172a", 0.06)}`,
          backgroundColor: alpha("#ffffff", 0.92),
          backdropFilter: "blur(10px)",
        },
      },
    },

    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          /**
           * Muchos componentes de layout en MUI descansan sobre Paper.
           * Si Paper y Card no están alineados, la interfaz se siente rota.
           */
          borderRadius: 22,
          border: `1px solid ${alpha("#0f172a", 0.06)}`,
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)",
          backgroundImage: "none",
        },
        rounded: {
          borderRadius: 22,
        },
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          /**
           * Antes el radio grande hacía que todo pareciera una cápsula inflada.
           * 22px sigue siendo moderno, pero ya se siente más firme y premium.
           */
          borderRadius: 22,
          border: `1px solid ${alpha("#0f172a", 0.06)}`,
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)",
          backgroundImage: "none",

          /**
           * Transición suave para hover en cards clicables.
           * No se exagera el movimiento para mantener tono corporativo.
           */
          transition:
            "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          /**
           * Padding generoso pero controlado.
           * 20 mantiene buena respiración sin desperdiciar espacio.
           */
          padding: 20,
          "&:last-child": {
            paddingBottom: 20,
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          /**
           * Aquí está uno de los cambios clave:
           * se elimina el borde tipo píldora total.
           *
           * Razón:
           * - Los botones deben verse precisos y sólidos.
           * - El pill completo se reserva para chips/badges.
           * - 14px da una sensación moderna, limpia y con mejor carácter.
           */
          borderRadius: 14,
          paddingInline: 18,
          minHeight: 40,
          fontWeight: 700,
          boxShadow: "none",
          transition:
            "background-color 180ms ease, border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease",
        },

        contained: {
          /**
           * El botón principal sí merece algo de profundidad,
           * pero sin la sombra vieja tipo material excesivo.
           */
          boxShadow: "0 8px 18px rgba(29, 78, 216, 0.18)",

          "&:hover": {
            boxShadow: "0 10px 22px rgba(29, 78, 216, 0.24)",
            transform: "translateY(-1px)",
          },
        },

        outlined: {
          borderWidth: 1,
          borderColor: alpha("#0f172a", 0.12),

          "&:hover": {
            borderWidth: 1,
            backgroundColor: alpha("#1d4ed8", 0.03),
            borderColor: alpha("#1d4ed8", 0.28),
          },
        },

        text: {
          "&:hover": {
            backgroundColor: alpha("#1d4ed8", 0.05),
          },
        },

        sizeSmall: {
          minHeight: 34,
          paddingInline: 14,
          borderRadius: 12,
        },

        sizeLarge: {
          minHeight: 46,
          paddingInline: 22,
          borderRadius: 16,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          /**
           * Aquí sí mantenemos pill completo.
           * El chip, por naturaleza, funciona bien como elemento cápsula.
           * Si se le quita esto, pierde parte de su lenguaje visual.
           */
          borderRadius: 999,
          fontWeight: 700,
        },

        sizeSmall: {
          height: 24,
        },

        filled: {
          backgroundColor: alpha("#1d4ed8", 0.08),
          color: "#1e3a8a",
        },

        outlined: {
          borderColor: alpha("#1d4ed8", 0.18),
          backgroundColor: alpha("#ffffff", 0.7),
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "#e2e8f0",
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          /**
           * Encabezado de tabla más sobrio, con fondo apenas distinto.
           * Suficiente para separar sin parecer reporte viejo de ERP.
           */
          fontWeight: 800,
          color: "#475569",
          backgroundColor: "#f8fafc",
          borderColor: "#e2e8f0",
        },
        root: {
          borderColor: "#e2e8f0",
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          /**
           * Los inputs necesitan sentirse cómodos, pero no tan redondos
           * como para parecer campos móviles estilo consumer app.
           */
          borderRadius: 14,
          backgroundColor: "#ffffff",
          transition:
            "border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease",

          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha("#1d4ed8", 0.34),
          },

          "&.Mui-focused": {
            boxShadow: `0 0 0 4px ${alpha("#1d4ed8", 0.10)}`,
          },

          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#1d4ed8",
            borderWidth: 1.5,
          },
        },

        notchedOutline: {
          borderColor: "#dbe2ea",
        },

        input: {
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#64748b",
          fontWeight: 600,
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          /**
           * El icon button no debe verse demasiado circular y blando.
           * Con 12 mantiene agilidad visual y mejor diálogo con botones normales.
           */
          borderRadius: 12,
          transition:
            "background-color 180ms ease, transform 180ms ease, color 180ms ease",

          "&:hover": {
            backgroundColor: alpha("#1d4ed8", 0.06),
            transform: "translateY(-1px)",
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 12,
          backgroundColor: alpha("#0f172a", 0.92),
          fontSize: "0.78rem",
          padding: "8px 10px",
        },
      },
    },
  },
});