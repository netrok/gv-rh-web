import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTH_STORAGE_EVENT,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokenStorage";
import { logoutRequest } from "../../api/auth.api";

export type AuthContextType = {
  token: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  roles: string[];
  login: (accessToken: string, refreshToken?: string | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type JwtPayload = {
  role?: string | string[];
  roles?: string | string[];
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?:
    | string
    | string[];
};

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const json = atob(padded);

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function normalizeRoles(input?: string | string[] | null): string[] {
  const values = Array.isArray(input) ? input : input ? [input] : [];

  return [
    ...new Set(values.map((r) => r.trim().toUpperCase()).filter(Boolean)),
  ];
}

function extractRoles(token: string | null): string[] {
  if (!token) return [];

  const payload = parseJwtPayload(token);
  if (!payload) return [];

  const directRoles = normalizeRoles(payload.roles);
  if (directRoles.length > 0) return directRoles;

  const directRole = normalizeRoles(payload.role);
  if (directRole.length > 0) return directRole;

  const microsoftRole = normalizeRoles(
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
  );
  if (microsoftRole.length > 0) return microsoftRole;

  return [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getAccessToken());

  useEffect(() => {
    const syncAuthState = () => {
      setToken(getAccessToken());
    };

    window.addEventListener(AUTH_STORAGE_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  const login = useCallback(
    (accessToken: string, refreshToken?: string | null) => {
      setTokens(accessToken, refreshToken);
      setToken(accessToken);
    },
    []
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      await logoutRequest(refreshToken);
    } catch {
      // Igual limpiamos sesión local.
    } finally {
      clearTokens();
      setToken(null);
      window.location.href = "/login";
    }
  }, []);

  const roles = useMemo(() => extractRoles(token), [token]);

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      accessToken: token,
      isAuthenticated: !!token,
      roles,
      login,
      logout,
    }),
    [token, roles, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}