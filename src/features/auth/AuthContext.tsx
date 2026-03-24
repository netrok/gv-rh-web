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

const AUTH_USER_STORAGE_KEY = "gv_rh_auth_user";
const AUTH_MUST_CHANGE_PASSWORD_KEY = "gv_rh_must_change_password";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  empleadoId?: number | null;
};

export type LoginSessionPayload = {
  accessToken: string;
  refreshToken?: string | null;
  user?: AuthUser | null;
  mustChangePassword?: boolean;
};

export type AuthContextType = {
  token: string | null;
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  roles: string[];
  mustChangePassword: boolean;
  login: (session: LoginSessionPayload) => void;
  logout: () => Promise<void>;
  markPasswordChanged: () => void;
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

function normalizeRole(input?: string | null): string {
  return String(input ?? "").trim().toUpperCase();
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

function readStoredMustChangePassword(): boolean {
  try {
    return localStorage.getItem(AUTH_MUST_CHANGE_PASSWORD_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredMustChangePassword(value: boolean) {
  if (value) {
    localStorage.setItem(AUTH_MUST_CHANGE_PASSWORD_KEY, "1");
  } else {
    localStorage.removeItem(AUTH_MUST_CHANGE_PASSWORD_KEY);
  }
}

function dispatchAuthSyncEvent() {
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}

function extractRoles(token: string | null, user: AuthUser | null): string[] {
  const userRole = normalizeRoles(user?.role);
  if (userRole.length > 0) return userRole;

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
  const [user, setUser] = useState<AuthUser | null>(readStoredUser());
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(
    readStoredMustChangePassword()
  );

  useEffect(() => {
    const syncAuthState = () => {
      const nextToken = getAccessToken();
      const nextUser = readStoredUser();
      const nextMustChangePassword = readStoredMustChangePassword();

      setToken(nextToken);
      setUser(nextUser);
      setMustChangePassword(nextMustChangePassword);
    };

    window.addEventListener(AUTH_STORAGE_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  const login = useCallback((session: LoginSessionPayload) => {
    const nextMustChangePassword = Boolean(
      session.mustChangePassword ?? session.user?.mustChangePassword ?? false
    );

    const nextUser = session.user
      ? {
          ...session.user,
          role: normalizeRole(session.user.role),
          mustChangePassword: nextMustChangePassword,
        }
      : null;

    setTokens(session.accessToken, session.refreshToken);
    writeStoredUser(nextUser);
    writeStoredMustChangePassword(nextMustChangePassword);

    setToken(session.accessToken);
    setUser(nextUser);
    setMustChangePassword(nextMustChangePassword);

    dispatchAuthSyncEvent();
  }, []);

  const markPasswordChanged = useCallback(() => {
    const updatedUser = user
      ? {
          ...user,
          mustChangePassword: false,
        }
      : null;

    writeStoredUser(updatedUser);
    writeStoredMustChangePassword(false);

    setUser(updatedUser);
    setMustChangePassword(false);

    dispatchAuthSyncEvent();
  }, [user]);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      await logoutRequest(refreshToken);
    } catch {
      // Igual limpiamos sesión local.
    } finally {
      clearTokens();
      writeStoredUser(null);
      writeStoredMustChangePassword(false);

      setToken(null);
      setUser(null);
      setMustChangePassword(false);

      dispatchAuthSyncEvent();
      window.location.href = "/login";
    }
  }, []);

  const roles = useMemo(() => extractRoles(token, user), [token, user]);

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      accessToken: token,
      user,
      isAuthenticated: !!token,
      roles,
      mustChangePassword,
      login,
      logout,
      markPasswordChanged,
    }),
    [token, user, roles, mustChangePassword, login, logout, markPasswordChanged]
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