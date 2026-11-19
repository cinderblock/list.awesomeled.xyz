import { Link } from 'react-router';
import { RainbowText } from '~/components/ui/RainbowText';
import { REPO_URL } from '~/lib/site';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-content">
        <p className="site-footer-text">
          <RainbowText>Awesome LED List</RainbowText> is a community resource. Data is provided
          as-is with no guarantee of accuracy.{' '}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="site-footer-link">
            Contribute on GitHub
          </a>
        </p>
        {/* Everything the header drops on small phones is still reachable here */}
        <nav className="site-footer-nav" aria-label="Footer">
          <Link to="/designer" className="site-footer-link">
            Designer
          </Link>
          <Link to="/system-overview" className="site-footer-link">
            System overview
          </Link>
          <Link to="/search" className="site-footer-link">
            Search
          </Link>
          <Link to="/compare" className="site-footer-link">
            Compare
          </Link>
          <Link to="/about" className="site-footer-link">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
