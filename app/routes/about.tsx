import type { Route } from "./+types/about";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About - Awesome LED List" },
    { name: "description", content: "About the Awesome LED List project" },
  ];
}

export default function About() {
  return (
    <main className="container py-8" style={{ maxWidth: "48rem" }}>
      <nav className="mb-2 flex items-center gap-2">
        <Link to="/" className="text-sm text-muted hover:text-foreground">
          Home
        </Link>
        <span className="text-muted">/</span>
        <span className="text-sm">About</span>
      </nav>

      <h1 className="text-3xl font-bold mb-6">About Awesome LED List</h1>

      <div style={{ lineHeight: 1.7 }}>
        <p className="text-lg mb-6">
          Awesome LED List is a community-maintained reference for the addressable LED ecosystem.
          Our goal is to help makers, installers, and enthusiasts find the right products for their
          projects.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">History</h2>
        <p className="mb-4">
          This project started as a Google Sheets document to organize information about LED
          controllers, pixels, and related products. As the community contributed more data, we
          decided to build a proper website to make the information more accessible and easier to
          browse.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Contributing</h2>
        <p className="mb-4">
          All data is stored in human-readable YAML files on GitHub. If you'd like to add or update
          information, you can submit a pull request to the repository.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Disclaimer</h2>
        <p className="mb-4">
          Information is provided "as-is" with no guarantee of accuracy. Product specifications may
          change, and we recommend verifying details with manufacturers before making purchasing
          decisions.
        </p>
      </div>
    </main>
  );
}
