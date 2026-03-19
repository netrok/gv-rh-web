import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";

import App from "./App";
import { gvRhTheme } from "./theme/gvRhTheme";
import { AuthProvider } from "./features/auth/AuthContext";
import { AppSnackbarProvider } from "./features/ui/AppSnackbarContext";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={gvRhTheme}>
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