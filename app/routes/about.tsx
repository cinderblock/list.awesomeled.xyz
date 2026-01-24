import type { Route } from './+types/about';
import { Link } from 'react-router';
import { RainbowText } from '~/components/ui/RainbowText';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'About - Awesome LED List' },
    { name: 'description', content: 'About the Awesome LED List project' },
  ];
}

export default function About() {
  return (
    <div className="container page-section">
      <div className="about-content">
        <nav className="breadcrumb">
          <Link to="/" className="breadcrumb-link">
            Home
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">About</span>
        </nav>

        <h1 className="page-title">
          About <RainbowText>Awesome LED List</RainbowText>
        </h1>

        <div className="prose">
          <p className="prose-lead">
            <RainbowText>Awesome LED List</RainbowText> is a community-maintained reference for the
            addressable LED ecosystem. Our goal is to help makers, installers, and enthusiasts find
            the right products for their projects.
          </p>

          <h2>History</h2>
          <p>
            This project started as a Google Sheets document to organize information about LED
            controllers, pixels, and related products. As the community contributed more data, we
            decided to build a proper website to make the information more accessible and easier to
            browse.
          </p>

          <h2>Contributing</h2>
          <p>
            All data is stored in human-readable YAML files on GitHub. If you'd like to add or
            update information, you can submit a pull request to the repository.
          </p>

          <h2>Disclaimer</h2>
          <p>
            Information is provided "as-is" with no guarantee of accuracy. Product specifications
            may change, and we recommend verifying details with manufacturers before making
            purchasing decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
