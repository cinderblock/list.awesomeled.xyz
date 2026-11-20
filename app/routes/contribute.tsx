import { Bug, FilePlus2, Flag, Pencil } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { PageWrapper } from '~/components/layout/PageWrapper';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { loadContributeData, type CategoryReference } from '~/lib/contribute.server';
import { pageMeta } from '~/lib/meta';
import { newIssueUrl, repoFileUrl, REPO_URL } from '~/lib/site';
import type { Route } from './+types/contribute';

export function meta(_args: Route.MetaArgs) {
  return pageMeta({
    title: 'Contribute',
    description:
      'Fix a value, add a product, or report a problem on the Awesome LED List: how changes are made and reviewed, and every field each category records.',
    path: '/contribute',
  });
}

export async function loader() {
  return loadContributeData();
}

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

// A link to /contribute#controllers should arrive with that category open.
// Browsers differ on whether a fragment inside a closed <details> opens it.
function useOpenTargetedDetails() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (target instanceof HTMLDetailsElement && !target.open) {
        target.open = true;
        target.scrollIntoView();
      }
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, []);
}

export default function Contribute({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData;
  useOpenTargetedDetails();

  return (
    <PageWrapper className="contribute-page">
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Contribute' }]} />

      <header className="page-header">
        <h1 className="page-title">Contribute</h1>
      </header>

      <div className="prose contribute">
        <p className="prose-lead">
          Every entry on this site is one small YAML file in a{' '}
          <a href={REPO_URL} {...external}>
            public GitHub repository
          </a>
          . Nothing is edited in place: each change is a pull request that is checked and reviewed
          before it goes live. That is what keeps a typo, or a vandal, from wiping a column the way
          it could in the spreadsheet this grew out of.
        </p>

        <h2 id="ways">Three ways to help</h2>
        <ul className="contribute-ways">
          <li>
            <Flag size={20} aria-hidden="true" />
            <div>
              <h3>Tell us</h3>
              <p>No Git needed. Say what is wrong or missing and, if you can, where you read it.</p>
              <p className="contribute-actions">
                <a
                  className="btn btn--outline btn--sm"
                  href={newIssueUrl({ template: '1-correction.yml' })}
                  {...external}
                >
                  Something is wrong
                </a>
                <a
                  className="btn btn--outline btn--sm"
                  href={newIssueUrl({ template: '2-new-entry.yml' })}
                  {...external}
                >
                  Something is missing
                </a>
              </p>
            </div>
          </li>
          <li>
            <Pencil size={20} aria-hidden="true" />
            <div>
              <h3>Fix an entry</h3>
              <p>
                Every entry page ends with <strong>Suggest an edit</strong>. It opens that entry’s
                file in GitHub’s editor; saving it there proposes the change as a pull request. You
                need a GitHub account, and nothing else.
              </p>
            </div>
          </li>
          <li>
            <FilePlus2 size={20} aria-hidden="true" />
            <div>
              <h3>Add an entry</h3>
              <p>
                Pick the category under <a href="#fields">Fields by category</a> and press{' '}
                <strong>Start a new entry</strong>. Only a name is required; fill in what you know,
                and copy from a similar entry for the rest.
              </p>
            </div>
          </li>
        </ul>

        <h2 id="review">What happens to a change</h2>
        <ol>
          <li>
            Automated checks run on the pull request: every file is validated against its category’s
            schema, and names that should link to other entries are resolved.
          </li>
          <li>
            The first time, a bot asks you to agree to the contributor agreement by posting a
            comment (
            <a href={repoFileUrl('CLA-DATABASE.md')} {...external}>
              for data
            </a>
            ,{' '}
            <a href={repoFileUrl('CLA-CODE.md')} {...external}>
              for code
            </a>
            ). It keeps the database under one open license.
          </li>
          <li>A maintainer reads it, and may ask where a number came from.</li>
          <li>Once merged, the site rebuilds itself and the change is live within minutes.</li>
        </ol>

        <h2 id="good-data">What makes a good entry</h2>
        <ul>
          <li>
            <strong>Facts from the maker.</strong> A datasheet, manual, or product page beats a
            reseller’s listing. Say where a value was read with <code>sources</code>, so the next
            person does not have to look it up again.
          </li>
          <li>
            <strong>The maker’s own names.</strong> Lists of supported parts keep the spelling the
            maker publishes; names that match another entry become links by themselves.
          </li>
          <li>
            <strong>Prices with a date.</strong> A price carries where and when it was read (
            <code>price_source</code>), and the site flags it once it is over a year old.
          </li>
          <li>
            <strong>Blank beats a guess.</strong> Leave out what you are not sure of. An empty field
            is an invitation; a wrong one is a trap.
          </li>
          <li>
            <strong>House style.</strong> Commas separate list items, periods are decimal
            separators, and lists use the Oxford comma.
          </li>
        </ul>
        <p>
          The full guide, including how to add images and run the site locally, is{' '}
          <a href={repoFileUrl('CONTRIBUTING.md')} {...external}>
            CONTRIBUTING.md
          </a>
          . Found a problem with the site itself rather than its data?{' '}
          <a href={newIssueUrl({ template: '3-site.yml' })} {...external}>
            <Bug size={14} aria-hidden="true" className="contribute-inline-icon" /> Report a site
            problem
          </a>
          .
        </p>

        <h2 id="fields">Fields by category</h2>
        <p>
          Generated from the same schemas the checks use, with how many entries fill each field in
          and the values in use, so a new entry can match what is already there.
        </p>
      </div>

      <div className="contribute-categories">
        {categories.map((category) => (
          <CategoryFields key={category.id} category={category} />
        ))}
      </div>
    </PageWrapper>
  );
}

function CategoryFields({ category }: { category: CategoryReference }) {
  const fieldCount = category.sections.reduce((sum, s) => sum + s.fields.length, 0);
  return (
    <details
      id={category.id}
      className="contribute-category"
      style={{ '--chip-hue': category.hue } as React.CSSProperties}
    >
      <summary>
        <span className="contribute-category-name">{category.name}</span>
        <span className="contribute-category-meta">
          {category.count} entries · {fieldCount} fields
        </span>
      </summary>

      <div className="contribute-category-body">
        <p className="contribute-category-intro">
          {category.description}.{' '}
          {category.sample && (
            <>
              A well-filled example: <Link to={category.sample.path}>{category.sample.name}</Link> (
              <a href={category.sample.sourceUrl} {...external}>
                its YAML
              </a>
              ).
            </>
          )}
          {category.exampleUrl && (
            <>
              {' '}
              Every field, filled in and explained:{' '}
              <a href={category.exampleUrl} {...external}>
                the annotated example
              </a>
              .
            </>
          )}
        </p>
        <p className="contribute-actions">
          <a className="btn btn--primary btn--sm" href={category.newEntryUrl} {...external}>
            <FilePlus2 size={14} aria-hidden="true" />
            Start a new entry
          </a>
          <a className="btn btn--outline btn--sm" href={category.folderUrl} {...external}>
            Browse the files
          </a>
          <Link className="btn btn--ghost btn--sm" to={category.path}>
            Open the table
          </Link>
        </p>

        {category.sections.map((section) => (
          <section key={section.label} className="contribute-section">
            <h3>{section.label}</h3>
            <div className="contribute-table-scroll">
              <table className="contribute-table">
                <thead>
                  <tr>
                    <th scope="col">Field</th>
                    <th scope="col">What it holds</th>
                    <th scope="col">Type</th>
                    <th scope="col" className="contribute-num">
                      Filled
                    </th>
                    <th scope="col">Values in use</th>
                  </tr>
                </thead>
                <tbody>
                  {section.fields.map((field) => (
                    <tr key={field.key}>
                      <th scope="row">
                        <code>{field.key}</code>
                      </th>
                      <td>
                        <span className="contribute-field-label">{field.label}</span>
                        {field.description && (
                          <span className="contribute-field-description">{field.description}</span>
                        )}
                      </td>
                      <td>{field.type}</td>
                      <td className="contribute-num">
                        {field.filled} of {category.count}
                      </td>
                      <td>{field.examples.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </details>
  );
}
