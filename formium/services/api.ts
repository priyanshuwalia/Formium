const BASE = "/api";

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: options?.body
      ? { "Content-Type": "application/json", ...options?.headers }
      : options?.headers,
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }

  return data as T;
}