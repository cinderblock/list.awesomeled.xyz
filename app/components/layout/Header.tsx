import { Link } from 'react-router';
import { Github } from 'lucide-react';
import { ThemeToggle } from '~/components/ui/ThemeToggle';
import { RainbowText } from '~/components/ui/RainbowText';
import { CategoryNav } from './CategoryNav';

export function Header() {
  return (
    <header className="bg-background sticky top-0 z-50 select-none">
      <div className="border-b">
        <div className="container flex items-center h-14 px-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold"
            style={{ textDecoration: 'none' }}
          >
            <RainbowText className="text-xl">Awesome LED List</RainbowText>
          </Link>
          <nav className="ml-auto flex items-center gap-4">
            <Link to="/about" className="text-sm text-muted hover:text-foreground">
              About
            </Link>
            <a
              href="https://github.com/cinderblock/awesomeledlist"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground"
              title="View on GitHub"
            >
              <Github size={20} />
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </div>
      <CategoryNav />
    </header>
  );
}
