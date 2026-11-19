import { Github, Search } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import { RainbowText } from '~/components/ui/RainbowText';
import { ThemeToggle } from '~/components/ui/ThemeToggle';
import { Tooltip } from '~/components/ui/Tooltip';
import { loadSearchIndex, openSearch } from '~/lib/search-client';
import { REPO_URL } from '~/lib/site';

const emptySubscribe = () => () => {};
// Apple keyboards say ⌘K; everything else says Ctrl K
const isApple = () => /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

// Start fetching the index as soon as someone reaches for search, so results
// are ready by the time they type
function warmSearch() {
  loadSearchIndex().catch(() => {
    // the palette reports a failed load itself
  });
}

export function Header() {
  // "Ctrl K" on the server and during hydration, the real key after
  const apple = useSyncExternalStore(emptySubscribe, isApple, () => false);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="container site-header-content">
          <Link to="/" className="site-logo">
            <RainbowText>Awesome LED List</RainbowText>
          </Link>
          <button
            type="button"
            className="site-search"
            aria-label="Search every category"
            aria-keyshortcuts={apple ? 'Meta+K' : 'Control+K'}
            onClick={() => openSearch()}
            onMouseEnter={warmSearch}
            onFocus={warmSearch}
          >
            <Search size={16} aria-hidden="true" />
            <span className="site-search-label">Search everything…</span>
            <kbd>{apple ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <nav className="site-nav" aria-label="Site">
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
                href={REPO_URL}
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
