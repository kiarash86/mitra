/**
 * Runtime feature flags reported by GET /api/v1/config. These reflect the
 * server's own configuration (env vars read at startup), not per-user
 * settings — they only change when the server is restarted.
 */
export interface AppConfig {
  chat_enabled: boolean;
}
