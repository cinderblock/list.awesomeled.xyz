import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '~/hooks/useTheme';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <button
      onClick={toggle}
      className="btn btn--ghost btn--icon"
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
