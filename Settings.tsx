import { useAuthStore } from "../store/authStore";

const BASE = import.meta.env.VITE_API_URL || "/api/v1";
let refreshing = null;

async function request(method, path, body) {
  const { accessToken, refresh } = useAuthStore.getState();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && accessToken) {
    if (!refreshing) refreshing = refresh().finally(() => { refreshing = null; });
    await refreshing;
    return request(method, path, body);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message), { status: res.status, data: err });
  }
  if (res.status === 204) return undefined;
  return res.json();
}

export const api = {
  get:    (path) =>             request("GET",    path),
  post:   (path, body) =>       request("POST",   path, body),
  patch:  (path, body) =>       request("PATCH",  path, body),
  delete: (path) =>             request("DELETE", path),
};
