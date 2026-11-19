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
      </div>
    </footer>
  );
}
