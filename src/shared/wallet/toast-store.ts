import { create } from 'zustand';

const TOAST_DURATION_MS = 2200;
const DEDUP_WINDOW_MS = 3000;

type ToastState = {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
};

let hideTimer: number | null = null;
let lastShownMessage = '';
let lastShownAt = 0;

function scheduleHide(clear: () => void) {
  if (hideTimer !== null) {
    clearTimeout(hideTimer);
  }
  hideTimer = setTimeout(() => {
    hideTimer = null;
    clear();
  }, TOAST_DURATION_MS) as unknown as number;
}

export const useToastStore = create<ToastState>((set, get) => ({
  message: null,

  show: (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const now = Date.now();
    if (trimmed === lastShownMessage && now - lastShownAt < DEDUP_WINDOW_MS) {
      return;
    }

    lastShownMessage = trimmed;
    lastShownAt = now;
    set({ message: trimmed });
    scheduleHide(() => get().clear());
  },

  clear: () => {
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    set({ message: null });
  },
}));

export function showGlobalToast(message: string) {
  useToastStore.getState().show(message);
}
