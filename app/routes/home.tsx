import {
  BadgeCheck,
  Download,
  GitCompareArrows,
  Link2,
  ListFilter,
  PencilRuler,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wifi,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { HomeSearch } from '~/components/home/HomeSearch';
import { RainbowText } from '~/components/ui/RainbowText';
import { RelativeDate } from '~/components/ui/RelativeDate';
import { loadHomeSummary } from '~/lib/home.server';
import { imageUrl } from '~/lib/images';
import { newIssueUrl, repoFileUrl, SITE_DESCRIPTION, SITE_NAME } from '~/lib/site';
import { CATEGORIES } from '~/lib/types';
import type { Route } from './+types/home';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: `${SITE_NAME}: addressable LEDs, pixel controllers, and parts` },
    { name: 'description', content: SITE_DESCRIPTION },
  ];
}

export async function loader() {
  return loadHomeSummary();
}

interface Start {
  to: string;
  icon: LucideIcon;
  title: string;
  hint: string;
}

// Ways in that are questions people actually arrive with. Each one lands on a
// view the old spreadsheet could not link to (e2e/home.test.ts checks that
// every filter here still matches something).
const STARTS: Start[] = [
  {
    to: '/controllers?f=wled_compatible:yes',
    icon: Wifi,
    title: 'Which controllers run WLED?',
    hint: 'A filtered table you can sort, extend, and share.',
  },
  {
    to: '/controllers?f=outputs.count:16-&sort=price',
    icon: ListFilter,
    title: '16 or more outputs, cheapest first',
    hint: 'Number filters take ranges, and sorting understands prices.',
  },
  {
    to: '/pixels?f=data.backup_line:yes',
    icon: ShieldCheck,
    title: 'Pixels with a backup data line',
    hint: 'One dead pixel doesn’t take the rest of the string with it.',
  },
  {
    to: '/compare?e=controllers/falcon-f16v4,controllers/falcon-f16v5',
    icon: Scale,
    title: 'Falcon F16V4 or F16V5?',
    hint: 'Up to four entries side by side, differences only.',
  },
  {
    to: '/designer',
    icon: PencilRuler,
    title: 'Plan a build',
    hint: 'Pick pixels and a controller; get compatibility checks, a power plan, and a parts list.',
  },
  {
    to: '/system-overview',
    icon: Workflow,
    title: 'How do the pieces fit together?',
    hint: 'The signal path from pattern software to light, as a diagram.',
  },
];

interface Feature {
  icon: LucideIcon;
  hue: number;
  title: string;
  body: ReactNode;
}

const FEATURES: Feature[] = [
  {
    icon: Search,
    hue: 250,
    title: 'Search everything at once',
    body: (
      <>
        Part numbers, makers, aliases, and protocols across all {CATEGORIES.length} categories.
        Press <kbd>Ctrl</kbd> <kbd>K</kbd> (<kbd>⌘</kbd> <kbd>K</kbd> on a Mac) on any page.
      </>
    ),
  },
  {
    icon: SlidersHorizontal,
    hue: 310,
    title: 'Filters that count',
    body: 'Every structured field is a filter and an optional column. Each choice shows how many entries match before you pick it.',
  },
  {
    icon: GitCompareArrows,
    hue: 25,
    title: 'Compare side by side',
    body: 'Tick up to four entries and see only the rows where they differ.',
  },
  {
    icon: Link2,
    hue: 150,
    title: 'Share exactly what you see',
    body: 'Search, sort, filters, and columns live in the address bar. Copy the link, or the table itself as Markdown or TSV.',
  },
  {
    icon: Download,
    hue: 200,
    title: 'Take the data with you',
    body: (
      <>
        CSV, JSON, or YAML of any view, or <a href="/database.csv.zip">the whole database</a>, under
        the Open Database License.
      </>
    ),
  },
  {
    icon: BadgeCheck,
    hue: 90,
    title: 'Nothing changes by accident',
    body: 'Every edit is a reviewed pull request with history. Each entry shows when it was last checked, and sourced values say where they came from.',
  },
];

export default function Home({ loaderData }: Route.ComponentProps) {
  const { counts, total, makers, lastReviewed, recent } = loaderData;

  return (
    <div className="container page-section home">
      <header className="home-hero">
        <h1 className="home-title">
          <RainbowText>Awesome LED List</RainbowText>
        </h1>
        <p className="home-tagline">
          Addressable LEDs, the controllers that drive them, and the parts in between. A community
          database you can search, filter, and compare, with a review date on every entry.
        </p>
        <HomeSearch total={total} />
        <ul className="home-stats">
          <li>
            <strong>{total}</strong> entries
          </li>
          <li>
            <strong>{CATEGORIES.length}</strong> categories
          </li>
          <li>
            <strong>{makers}</strong> makers
          </li>
          {lastReviewed && (
            <li>
              last review <RelativeDate date={lastReviewed} />
            </li>
          )}
        </ul>
      </header>

      <section className="home-section" aria-labelledby="home-starts-title">
        <h2 id="home-starts-title" className="home-section-title">
          Start with a question
        </h2>
        <ul className="home-grid">
          {STARTS.map(({ to, icon: Icon, title, hint }) => (
            <li key={to}>
              <Link to={to} className="home-start" prefetch="intent">
                <Icon size={20} aria-hidden="true" />
                <span>
                  <span className="home-start-title">{title}</span>
                  <span className="home-start-hint">{hint}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section" aria-labelledby="home-categories-title">
        <h2 id="home-categories-title" className="home-section-title">
          Browse by category
        </h2>
        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              to={category.path}
              prefetch="intent"
              viewTransition
              className="category-card"
              style={{ '--card-hue': category.color.hue } as React.CSSProperties}
            >
              <h3 className="category-card-title">{category.name}</h3>
              <p className="category-card-description">{category.description}</p>
              <span className="category-card-badge">{counts[category.id] || 0} entries</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="home-features-title">
        <h2 id="home-features-title" className="home-section-title">
          More than a spreadsheet
        </h2>
        <p className="home-section-lede">
          The list began in 2019 as a shared Google Sheet, and outgrew it.{' '}
          <Link to="/about">Here is the story</Link>; this is what the move bought.
        </p>
        <ul className="home-grid">
          {FEATURES.map(({ icon: Icon, hue, title, body }) => (
            <li
              key={title}
              className="home-feature"
              style={{ '--feature-hue': hue } as React.CSSProperties}
            >
              <Icon size={22} aria-hidden="true" />
              <h3 className="home-feature-title">{title}</h3>
              <p className="home-feature-text">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {recent.length > 0 && (
        <section className="home-section" aria-labelledby="home-recent-title">
          <h2 id="home-recent-title" className="home-section-title">
            Recently reviewed
          </h2>
          <p className="home-section-lede">
            Entries are re-checked against their makers’ pages over time. These were looked at last.
          </p>
          <ul className="home-recent">
            {recent.map((entry) => {
              const category = CATEGORIES.find((c) => c.id === entry.category)!;
              return (
                <li key={`${entry.category}/${entry.id}`}>
                  <Link to={`${category.path}/${entry.id}`} className="home-recent-item">
                    <span className="home-recent-thumb" aria-hidden="true">
                      {entry.image && (
                        <img
                          src={imageUrl(entry.category, entry.image, 'sm')}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </span>
                    <span className="home-recent-main">
                      <span className="home-recent-name">{entry.name}</span>
                      <span className="home-recent-meta">
                        {entry.maker ? `${entry.maker} · ` : ''}
                        <RelativeDate date={entry.updated} />
                      </span>
                    </span>
                    <span
                      className="home-recent-category"
                      style={{ '--chip-hue': category.color.hue } as React.CSSProperties}
                    >
                      {category.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="home-section home-contribute" aria-labelledby="home-contribute-title">
        <div className="home-contribute-text">
          <h2 id="home-contribute-title" className="home-section-title">
            Spotted a mistake? Know a product that’s missing?
          </h2>
          <p>
            The data is plain YAML on GitHub. Corrections arrive as pull requests, so they are
            reviewed before they go live. If you’d rather just tell us, open an issue.
          </p>
        </div>
        <div className="home-contribute-actions">
          <a
            className="btn btn--primary"
            href={newIssueUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Report a problem
          </a>
          <a
            className="btn btn--outline"
            href={repoFileUrl('CONTRIBUTING.md')}
            target="_blank"
            rel="noopener noreferrer"
          >
            How to contribute
          </a>
        </div>
      </section>
    </div>
  );
}
