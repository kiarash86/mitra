import axios from "axios";

const apiOrigin = import.meta.env.VITE_API_URL || "";

const client = axios.create({
  baseURL: `${apiOrigin}/api`,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const raw = localStorage.getItem("auth-storage");
  if (raw) {
    try {
      const { state } = JSON.parse(raw);
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    } catch {
      // corrupted storage, ignore
    }
  }
  return config;
});

// The API has no token-refresh endpoint (access tokens are short-lived by
// design), so a 401 always means the session is over — clear it and send
// the user back to /login rather than retrying.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default client;
