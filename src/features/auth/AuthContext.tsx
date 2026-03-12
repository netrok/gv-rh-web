import { createContext, useContext, useMemo, useState } from "react";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokenStorage";
import { logoutRequest } from "../../api/auth.api";

type AuthContextType = {
  token: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken?: string | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getAccessToken());

  const login = (accessToken: string, refreshToken?: string | null) => {
    setTokens(accessToken, refreshToken);
    setToken(accessToken);
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();

    try {
      await logoutRequest(refreshToken);
    } catch {
      // Aquí no hacemos drama; igual vamos a limpiar sesión local.
    } finally {
      clearTokens();
      setToken(null);
      window.location.href = "/login";
    }
  };

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: !!token,
      login,
      logout,
    }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}