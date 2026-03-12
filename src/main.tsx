import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";
import { AuthProvider } from "./features/auth/AuthContext";
import { AppSnackbarProvider } from "./features/ui/AppSnackbarContext";

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: "#1f2937",
    },
    secondary: {
      main: "#7c3aed",
    },
    background: {
      default: "#f5f7fb",
    },
  },
  shape: {
    borderRadius: 12,
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppSnackbarProvider>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </AppSnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);