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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return client(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const raw = localStorage.getItem("auth-storage");
      if (!raw) throw new Error("No auth storage");
      const { state } = JSON.parse(raw);
      if (!state?.refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(
        `${client.defaults.baseURL}/v1/auth/refresh`,
        { refresh_token: state.refreshToken }
      );

      const newToken: string = data.access_token;
      const newRefresh: string = data.refresh_token;

      const updated = JSON.parse(raw);
      state.accessToken = newToken;
      state.refreshToken = newRefresh;
      localStorage.setItem("auth-storage", JSON.stringify(updated));

      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;