import { useSyncExternalStore } from 'react';
import { getToasts, subscribeToasts, type Toast } from '~/lib/toast';

const NONE: Toast[] = [];
const serverSnapshot = () => NONE;

/** Renders the toasts raised through lib/toast, announced politely. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, serverSnapshot);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast${t.tone === 'error' ? ' toast--error' : ''}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
