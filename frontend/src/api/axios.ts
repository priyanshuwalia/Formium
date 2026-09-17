import axios from "axios";
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

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      emitAuthLogout();
    }

    return Promise.reject(error);
  },
);

export default API;
