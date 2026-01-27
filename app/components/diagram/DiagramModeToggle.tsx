import { useEffect, useState } from 'react';

const STORAGE_KEY = 'diagram-mode';

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
  const [isSimple, setIsSimple] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsSimple(stored === 'simple');
    }
    setIsHydrated(true);
  }, []);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setIsSimple(e.newValue === 'simple');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setMode = (simple: boolean) => {
    setIsSimple(simple);
    localStorage.setItem(STORAGE_KEY, simple ? 'simple' : 'advanced');
  };

  // Return true (simple) as default before hydration to avoid flicker
  return [isHydrated ? isSimple : true, setMode];
}
