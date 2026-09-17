import axios from "axios";
import { emitAuthLogout } from "../utils/authEvents";

const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? "https://form-buddy-ux2b.vercel.app/api"
  : "http://localhost:4000/api";

// The API is always mounted under /api. A misconfigured VITE_API_BASE_URL
// (e.g. "https://api.example.com" without the suffix) used to send every
// request one path segment too high and produce 404s — normalize it here.
export const normalizeApiBaseUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
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
