import { alpha, createTheme } from "@mui/material/styles";

export const gvRhTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1d4ed8",
    },
    secondary: {
      main: "#0f172a",
    },
    background: {
      default: "#f3f4f6",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
      secondary: "#6b7280",
    },
    divider: "#e5e7eb",
  },

  shape: {
    borderRadius: 16,
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
    body1: {
      fontSize: "0.95rem",
      lineHeight: 1.55,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      fontSize: "0.92rem",
    },
    caption: {
      fontSize: "0.78rem",
      lineHeight: 1.4,
    },
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
        body: {
          backgroundColor: "#f3f4f6",
        },
        "*": {
          boxSizing: "border-box",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: "1px solid #e5e7eb",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
          backgroundImage: "none",
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
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
          borderRadius: 999,
          paddingInline: 16,
          minHeight: 40,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
        sizeSmall: {
          height: 24,
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 800,
          color: "#475569",
          backgroundColor: "#f8fafc",
        },
        root: {
          borderColor: "#e5e7eb",
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
          borderRadius: 14,
          backgroundColor: "#fff",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha("#1d4ed8", 0.35),
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 1.5,
          },
        },
      },
    },
  },
});