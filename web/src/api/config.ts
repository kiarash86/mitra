import client from "./client";
import type { AppConfig } from "../types/config";

export const configApi = {
  get: () => client.get<AppConfig>("/v1/config").then((r) => r.data),
};
