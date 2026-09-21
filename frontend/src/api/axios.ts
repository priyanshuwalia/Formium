import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { emitAuthLogout } from "../utils/authEvents";

const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? "https://form-buddy-ux2b.vercel.app/api"
  : "http://localhost:4000/api";

// The API is always mounted under /api.
//
// Vercel env vars are stored verbatim, so a value pasted as
// `"https://api.example.com"` (with literal quotes, like it appeared in a
// .env file) would otherwise be treated by the browser as a *relative* URL and
// resolved against the site origin. Strip stray quotes, ensure an absolute
// scheme, and append the /api suffix.
export const normalizeApiBaseUrl = (rawUrl: string) => {
  let url = rawUrl.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!url) return DEFAULT_API_BASE_URL;

  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
    url = `https://${url}`;
  }

  url = url.replace(/\/+$/, "");
  return url.endsWith("/api") ? url : `${url}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
);

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Auth endpoints must never trigger the refresh-and-retry dance below.
const AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/google",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
];

// Auth is httpOnly-cookie based: no Authorization header is attached, and the
// server transparently rotates the access cookie from the refresh cookie.
API.interceptors.request.use((config) => config);

let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = API.post("/auth/refresh")
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const url = original?.url ?? "";
    const isAuthPath = AUTH_PATHS.some((path) => url.includes(path));

    if (status === 401 && original && !original._retry && !isAuthPath) {
      original._retry = true;
      const ok = await refreshAccessToken();
      if (ok) {
        return API(original);
      }
    }

    if (status === 401 && !isAuthPath) {
      emitAuthLogout();
    }

    return Promise.reject(error);
  },
);

export default API;