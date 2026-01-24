import { Link } from 'react-router';
import { Github } from 'lucide-react';
import { ThemeToggle } from '~/components/ui/ThemeToggle';
import { RainbowText } from '~/components/ui/RainbowText';

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="container site-header-content">
          <Link to="/" className="site-logo">
            <RainbowText>Awesome LED List</RainbowText>
          </Link>
          <nav className="site-nav">
            <Link to="/about" className="btn btn--ghost btn--icon site-nav-link">
              About
            </Link>
            <a
              href="https://github.com/cinderblock/awesomeledlist"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost btn--icon site-nav-link"
              title="View on GitHub"
            >
              <Github size={20} />
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
