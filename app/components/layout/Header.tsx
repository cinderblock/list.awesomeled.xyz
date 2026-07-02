import { Github } from 'lucide-react';
import { Link } from 'react-router';
import { RainbowText } from '~/components/ui/RainbowText';
import { ThemeToggle } from '~/components/ui/ThemeToggle';
import { Tooltip } from '~/components/ui/Tooltip';

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="container site-header-content">
          <Link to="/" className="site-logo">
            <RainbowText>Awesome LED List</RainbowText>
          </Link>
          <nav className="site-nav">
            <Link to="/designer" className="btn btn--ghost site-nav-link">
              Designer
            </Link>
            <Link to="/about" className="btn btn--ghost site-nav-link">
              About
            </Link>
            {/*
            <a
              href="https://forum.awesomeled.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost site-nav-link"
            >
              Forums
            </a>
            */}
            <Tooltip content="View on GitHub">
              <a
                href="https://github.com/cinderblock/awesomeledlist"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost btn--icon site-nav-link"
                aria-label="View on GitHub"
              >
                <Github size={20} />
              </a>
            </Tooltip>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
