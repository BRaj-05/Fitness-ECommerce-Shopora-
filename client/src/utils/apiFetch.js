import { API_URL } from "../config/app";

export async function apiFetch(input, init = {}) {
  const request = { ...init, credentials: "include" };
  let response = await fetch(input, request);
  if (response.status !== 401 || String(input).includes("/api/auth/")) return response;
  const refreshed = await fetch(`${API_URL}/api/auth/refresh`, { method: "POST", credentials: "include" });
  if (!refreshed.ok) return response;
  response = await fetch(input, request);
  return response;
}
