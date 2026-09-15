import { create } from "zustand";
import { configApi } from "../api/config";

interface AppConfigState {
  /**
   * Whether the server has chat turned on (ENABLE_CHAT). Only meaningful
   * once `isLoaded` is true — until then it's a placeholder, not an answer.
   * Consumers must check `isLoaded` first rather than treating `false` as
   * "disabled", otherwise they act on a value that hasn't arrived yet.
   */
  chatEnabled: boolean;
  isLoaded: boolean;

  hydrateConfig: () => Promise<void>;
}

// Not persisted: this describes the server the app is currently talking to,
// so it's re-fetched on each boot rather than carried across sessions.
export const useAppConfigStore = create<AppConfigState>()((set) => ({
  chatEnabled: false,
  isLoaded: false,

  hydrateConfig: async () => {
    try {
      const config = await configApi.get();
      set({ chatEnabled: config.chat_enabled, isLoaded: true });
    } catch {
      // The request failed (offline, server down, 401 that couldn't be
      // refreshed). Still mark it loaded so nothing waits on a spinner
      // forever — chat stays hidden, which is the safe direction: a
      // hidden-but-available feature is recoverable on the next load,
      // a visible-but-broken one just errors when clicked.
      set({ isLoaded: true });
    }
  },
}));
