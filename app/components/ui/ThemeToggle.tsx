import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useTheme } from '~/hooks/useTheme';
import { Tooltip } from '~/components/ui/Tooltip';

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Returns false on server, true on client - no effect needed
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const toggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Render a placeholder with the same dimensions to avoid layout shift
  if (!mounted) {
    return (
      <button className="btn btn--ghost btn--icon" aria-label="Toggle theme">
        <span style={{ width: '1.25rem', height: '1.25rem' }} />
      </button>
    );
  }

  return (
    <Tooltip content={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}>
      <button
        onClick={toggle}
        className="btn btn--ghost btn--icon"
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </Tooltip>
  );
}
