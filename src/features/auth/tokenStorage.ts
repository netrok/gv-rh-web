const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const AUTH_STORAGE_EVENT = "auth-storage-changed";

function notifyAuthStorageChanged(): void {
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(
  accessToken: string,
  refreshToken?: string | null
): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken && refreshToken.trim()) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  notifyAuthStorageChanged();
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notifyAuthStorageChanged();
}