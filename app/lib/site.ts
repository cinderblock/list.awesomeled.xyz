/**
 * Site-wide constants and URL builders: where the site lives, where its source
 * lives, and how to deep-link into GitHub for edits, history and reports.
 *
 * One place to change when the repository or domain moves — the header, footer,
 * about page and contribution links all read from here.
 */

export const SITE_NAME = 'Awesome LED List';
/** Canonical production origin (no trailing slash). Previews keep pointing here. */
export const SITE_ORIGIN = 'https://awesomeled.xyz';
export const SITE_DESCRIPTION =
  'A reviewed, searchable database of addressable LEDs, pixel controllers, and the parts that connect them.';

export const REPO_SLUG = 'cinderblock/list.awesomeled.xyz';
export const REPO_BRANCH = 'master';
export const REPO_URL = `https://github.com/${REPO_SLUG}`;

/** The Google Sheet this site grew out of (kept for history / attribution). */
export const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA';

/** Absolute URL on the canonical origin for a site path ("/controllers"). */
export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Repo-relative path of an entry's YAML source. */
export function entrySourcePath(categoryId: string, entryId: string): string {
  return `database/${categoryId}/${entryId}.yaml`;
}

/** View a repository file on GitHub. */
export function repoFileUrl(path: string): string {
  return `${REPO_URL}/blob/${REPO_BRANCH}/${path}`;
}

/** GitHub's web editor for an entry: forks and opens a pull request for non-collaborators. */
export function editEntryUrl(categoryId: string, entryId: string): string {
  return `${REPO_URL}/edit/${REPO_BRANCH}/${entrySourcePath(categoryId, entryId)}`;
}

/** Commit history of one entry (the site's answer to a sheet's version history). */
export function entryHistoryUrl(categoryId: string, entryId: string): string {
  return `${REPO_URL}/commits/${REPO_BRANCH}/${entrySourcePath(categoryId, entryId)}`;
}

/**
 * GitHub's "create new file" page for a category, pre-filled with a starter
 * YAML document. GitHub reads `filename` and `value` from the query string.
 */
export function newEntryUrl(categoryId: string, template: string, filename = 'new-entry.yaml') {
  const params = new URLSearchParams({ filename, value: template });
  return `${REPO_URL}/new/${REPO_BRANCH}/database/${categoryId}?${params.toString()}`;
}

/**
 * A new-issue link. `template` names a file in .github/ISSUE_TEMPLATE; the
 * remaining fields pre-fill issue-form inputs by their `id`.
 */
export function newIssueUrl(fields: Record<string, string | undefined> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `${REPO_URL}/issues/new${query ? `?${query}` : ''}`;
}
