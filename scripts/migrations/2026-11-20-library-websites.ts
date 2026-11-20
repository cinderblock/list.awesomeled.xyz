#!/usr/bin/env bun
/**
 * Drive libraries: a website is not a repository.
 *
 * `links` had only `repo` and `youtube`, so nine projects kept their website
 * in `links.repo` (artnet2twinkly.com, xod.io, the OctoWS2811 page on
 * pjrc.com, ...). The schema now has `links.url` for the website; a `repo`
 * that isn't on a code host moves there, with its `sources` key.
 */

import { getJS, migrateCategory, orderKeys, renameKey } from './lib';

const CODE_HOSTS = /^(github\.com|gitlab\.com|bitbucket\.org|codeberg\.org|sourceforge\.net)$/;

const done = migrateCategory('drive-libraries', (doc, { id }) => {
  const repo = getJS(doc, ['links', 'repo']);
  if (typeof repo !== 'string') return false;
  let host: string;
  try {
    host = new URL(repo).hostname.replace(/^www\./, '');
  } catch {
    throw new Error(`drive-libraries/${id}: links.repo ${JSON.stringify(repo)}`);
  }
  if (CODE_HOSTS.test(host)) return false;
  if (getJS(doc, ['links', 'url']) !== undefined)
    throw new Error(`drive-libraries/${id}: links.url already set`);
  renameKey(doc, ['links'], 'repo', 'url');
  renameKey(doc, ['sources'], 'links.repo', 'links.url');
  orderKeys(doc, ['links'], ['url', 'repo', 'youtube']);
  return true;
});
console.log(`drive-libraries: ${done.length} entries migrated`);
