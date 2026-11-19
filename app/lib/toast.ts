/**
 * A tiny toast store: brief confirmations ("Link copied") that any code can
 * raise without threading React context through. <Toaster /> in the layout
 * renders them in a live region.
 */

export interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'error';
}

type Listener = () => void;

const listeners = new Set<Listener>();
let toasts: Toast[] = [];
let nextId = 1;

function emit() {
  listeners.forEach((listener) => listener());
}

/** Show a short message for a few seconds. */
export function toast(message: string, tone: Toast['tone'] = 'info', ms = 2600): void {
  const id = nextId++;
  toasts = [...toasts, { id, message, tone }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, ms);
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): Toast[] {
  return toasts;
}
