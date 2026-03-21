import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    neutral: Palette["primary"];
  }

  interface PaletteOptions {
    neutral?: PaletteOptions["primary"];
  }
}

const gvRhTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f4b99",
      light: "#4f77bf",
      dark: "#16376f",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#4f5d75",
      light: "#7c879a",
      dark: "#394456",
      contrastText: "#ffffff",
    },
    success: {
      main: "#2e7d32",
    },
    warning: {
      main: "#b7791f",
    },
    error: {
      main: "#c62828",
    },
    info: {
      main: "#1565c0",
    },
    neutral: {
      main: "#64748b",
      light: "#94a3b8",
      dark: "#475569",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f5f7fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#162033",
      secondary: "#5b667a",
    },
    divider: "#e6ebf2",
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
      fontSize: "2rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 700,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 700,
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 600,
    },
    subtitle2: {
      fontSize: "0.95rem",
      fontWeight: 600,
    },
    body1: {
      fontSize: "0.98rem",
      lineHeight: 1.65,
    },
    body2: {
      fontSize: "0.92rem",
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: "0.01em",
    },
    caption: {
      fontSize: "0.8rem",
      color: "#6b7280",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f5f7fb",
        },
        "#root": {
          minHeight: "100vh",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 12,
          paddingInline: 16,
        },
        containedPrimary: {
          boxShadow: "0 10px 24px rgba(31, 75, 153, 0.16)",
        },
        outlined: {
          borderWidth: 1,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: "1px solid #e6ebf2",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
          backgroundColor: "#ffffff",
          backgroundImage: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
        label: {
          paddingInline: 10,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          paddingTop: 4,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          paddingBottom: 8,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingTop: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        fullWidth: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "#ffffff",
          "& fieldset": {
            borderColor: "#d7deea",
          },
          "&:hover fieldset": {
            borderColor: "#b8c4d9",
          },
          "&.Mui-focused fieldset": {
            borderWidth: 1,
          },
        },
        input: {
          paddingTop: 11,
          paddingBottom: 11,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 800,
          color: "#334155",
          backgroundColor: "#f4f7fc",
          borderBottom: "1px solid #e6ebf2",
        },
        body: {
          borderBottom: "1px solid #edf2f7",
          verticalAlign: "middle",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": {
            borderBottom: "none",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
  },
});

export default gvRhTheme;