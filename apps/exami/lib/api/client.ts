import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiEnvelope } from "@/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

/**
 * In-memory access token + a refresh token persisted to localStorage.
 * Access token never touches storage (XSS-safe-ish); refresh survives reloads.
 */
let accessToken: string | null = null;

const REFRESH_KEY = "exami.refreshToken";

export function setTokens(access: string | null, refresh?: string | null) {
  accessToken = access;
  if (typeof window === "undefined") return;
  if (refresh === undefined) return;
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  else localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  accessToken = null;
  if (typeof window !== "undefined") localStorage.removeItem(REFRESH_KEY);
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

// Attach the bearer token on every request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    config.headers = headers;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await axios.post<ApiEnvelope<{ accessToken: string }>>(
      `${API_URL}/auth/refresh`,
      { refreshToken },
    );
    const newAccess = res.data?.data?.accessToken ?? null;
    accessToken = newAccess;
    return newAccess;
  } catch {
    clearTokens();
    return null;
  }
}

// Unwrap the { success, data } envelope and transparently refresh once on 401.
api.interceptors.response.use(
  (response) => {
    const body = response.data as ApiEnvelope<unknown> | undefined;
    if (body && typeof body === "object" && "success" in body) {
      if (!body.success) {
        throw new ApiError(
          body.error?.code ?? response.status,
          body.error?.message ?? "Request failed",
        );
      }
      // Replace payload with the unwrapped data (keep meta accessible).
      (response as { data: unknown }).data = body.data;
      (response as { meta?: unknown }).meta = body.meta;
    }
    return response;
  },
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes("/auth/")
    ) {
      original._retried = true;
      refreshing = refreshing ?? doRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        const headers = AxiosHeaders.from(original.headers);
        headers.set("Authorization", `Bearer ${newToken}`);
        original.headers = headers;
        return api(original);
      }
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    const payload = error.response?.data;
    if (payload && typeof payload === "object" && "error" in payload) {
      throw new ApiError(
        payload.error?.code ?? error.response?.status ?? 500,
        payload.error?.message ?? error.message,
      );
    }
    throw new ApiError(error.response?.status ?? 500, error.message);
  },
);

/** Convenience: GET → unwrapped data. */
export async function get<T>(
  url: string,
  params?: object,
): Promise<T> {
  const res = await api.get(url, { params });
  return res.data as T;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post(url, body);
  return res.data as T;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.patch(url, body);
  return res.data as T;
}

export async function del<T>(url: string): Promise<T> {
  const res = await api.delete(url);
  return res.data as T;
}
