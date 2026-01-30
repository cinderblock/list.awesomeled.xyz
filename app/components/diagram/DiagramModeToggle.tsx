import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'diagram-mode';

// Pub/sub for local state updates (storage events only fire in other tabs)
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);

  // Also listen for storage events from other tabs
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function getSnapshot() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? 'simple' : stored;
}

function getServerSnapshot() {
  return 'simple';
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

interface DiagramModeToggleProps {
  value: boolean;
  onChange: (simple: boolean) => void;
}

export function DiagramModeToggle({ value, onChange }: DiagramModeToggleProps) {
  return (
    <div className="diagram-mode-toggle">
      <button
        type="button"
        className={`diagram-mode-toggle-button ${value ? 'simple' : 'advanced'}`}
        onClick={() => onChange(!value)}
        aria-label={`Switch to ${value ? 'Advanced' : 'Simple'} view`}
      >
        <span className="toggle-track">
          <span className="toggle-thumb" />
        </span>
        <span className="toggle-labels">
          <span className={`toggle-label toggle-label-simple ${value ? 'active' : ''}`}>
            Simple
          </span>
          <span className={`toggle-label toggle-label-advanced ${!value ? 'active' : ''}`}>
            Advanced
          </span>
        </span>
      </button>
    </div>
  );
}

export function useDiagramMode(): [boolean, (simple: boolean) => void] {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((simple: boolean) => {
    localStorage.setItem(STORAGE_KEY, simple ? 'simple' : 'advanced');
    emitChange();
  }, []);

  return [mode === 'simple', setMode];
}
