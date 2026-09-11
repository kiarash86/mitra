import axios from "axios";
import { useAuthStore } from "../stores/auth";

const apiOrigin = import.meta.env.VITE_API_URL || "";

const client = axios.create({
  baseURL: `${apiOrigin}/api`,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Coalesces concurrent 401s into a single POST /auth/refresh: every request
// that hits a 401 while a refresh is already in flight awaits the same
// promise instead of firing its own refresh call.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    return Promise.reject(new Error("no refresh token"));
  }

  // Plain axios, not `client` — avoids re-entering these interceptors and
  // attaching a stale/expired Authorization header to the refresh call.
  refreshPromise = axios
    .post<{ access_token: string; refresh_token: string }>(
      `${apiOrigin}/api/v1/auth/refresh`,
      { refresh_token: refreshToken }
    )
    .then(({ data }) => {
      useAuthStore.setState({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      return data.access_token;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthEndpoint =
      original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");

    if (err.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return client(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export default client;
