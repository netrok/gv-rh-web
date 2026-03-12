import { createContext, useContext, useMemo, useState } from "react";
import { Alert, Snackbar, type AlertColor } from "@mui/material";

type AppSnackbarContextType = {
  showSnackbar: (message: string, severity?: AlertColor) => void;
};

const AppSnackbarContext = createContext<AppSnackbarContextType | undefined>(undefined);

export function AppSnackbarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message: string, severity: AlertColor = "success") => {
    setState({
      open: true,
      message,
      severity,
    });
  };

  const value = useMemo(
    () => ({
      showSnackbar,
    }),
    []
  );

  return (
    <AppSnackbarContext.Provider value={value}>
      {children}

      <Snackbar
        open={state.open}
        autoHideDuration={3500}
        onClose={() => setState((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={state.severity}
          variant="filled"
          onClose={() => setState((prev) => ({ ...prev, open: false }))}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </AppSnackbarContext.Provider>
  );
}

export function useAppSnackbar() {
  const context = useContext(AppSnackbarContext);

  if (!context) {
    throw new Error("useAppSnackbar debe usarse dentro de AppSnackbarProvider");
  }

  return context;
}