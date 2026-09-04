import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (variant: ToastVariant, message: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (variant, message) =>
    set((s) => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), variant, message }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((item) => item.id !== id) })),
}));

/**
 * Plain-function helpers for pushing a toast from outside a component —
 * store actions and .catch() handlers can't call the useToastStore hook,
 * but can call these instead.
 */
export const toast = {
  success: (message: string) => useToastStore.getState().push("success", message),
  error: (message: string) => useToastStore.getState().push("error", message),
  info: (message: string) => useToastStore.getState().push("info", message),
};
