#!/usr/bin/env bun
/**
 * Check Cloudflare Pages deployment status for this project.
 *
 * Usage:
 *   bun .claude/skills/deploy/check-deploy.ts [branch] [--watch] [--json] [--all]
 *
 *   branch    Only show the latest deployment for this branch (e.g. "master",
 *             "rich-schema"). Omit to show the latest deployment per branch.
 *   --watch   Poll every 15s until the matched deployment reaches a terminal
 *             state (success / failure / canceled / skipped).
 *   --json    Print raw JSON instead of the formatted table.
 *   --all     Show every deployment on the first page (not just latest-per-branch).
 *
 * Reads CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_PAGES_PROJECT
 * from `.env.local` then `.env` in this skill's directory (process env wins over both).
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));

// ---- env loading -----------------------------------------------------------

/** Minimal .env parser: KEY=VALUE lines, supports quotes, `export`, and # comments. */
function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

/** Load .env then .env.local from the skill dir; real process env takes precedence. */
function loadEnv(): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const name of ['.env', '.env.local']) {
    const p = join(SKILL_DIR, name);
    if (existsSync(p)) Object.assign(merged, parseEnv(readFileSync(p, 'utf8')));
  }
  // Anything already in the real environment wins (e.g. CI / shell export).
  for (const k of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_PAGES_PROJECT']) {
    if (process.env[k]) merged[k] = process.env[k] as string;
  }
  return merged;
}

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const env = loadEnv();

const token = env.CLOUDFLARE_API_TOKEN;
const accountId = env.CLOUDFLARE_ACCOUNT_ID;
const project = env.CLOUDFLARE_PAGES_PROJECT || 'list-awesomeled-xyz';

if (!token || !accountId) {
  const missing = [!token && 'CLOUDFLARE_API_TOKEN', !accountId && 'CLOUDFLARE_ACCOUNT_ID'].filter(
    Boolean
  );
  fail(
    `Missing required env var(s): ${missing.join(', ')}\n\n` +
      `Fix this by creating a local env file:\n` +
      `  1. cd .claude/skills/deploy\n` +
      `  2. cp .env.example .env.local\n` +
      `  3. Fill in the values:\n` +
      `       - CLOUDFLARE_API_TOKEN : token with "Account -> Cloudflare Pages -> Read" permission\n` +
      `                                create at https://dash.cloudflare.com/profile/api-tokens\n` +
      `       - CLOUDFLARE_ACCOUNT_ID: from the dashboard URL or Workers & Pages -> Overview\n\n` +
      `If you don't have a token yet, ask the repo owner to generate one with the\n` +
      `"Cloudflare Pages: Read" permission for the "${project}" project.`
  );
}

// ---- args ------------------------------------------------------------------

const argv = process.argv.slice(2);
const watch = argv.includes('--watch');
const asJson = argv.includes('--json');
const showAll = argv.includes('--all');
const branchArg = argv.find((a) => !a.startsWith('--'));

// ---- Cloudflare API --------------------------------------------------------

const API = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project}/deployments`;

const TERMINAL = new Set(['success', 'failure', 'canceled', 'skipped']);

type Deployment = {
  id: string;
  short_id: string;
  url: string;
  environment: string;
  created_on: string;
  latest_stage: { name: string; status: string } | null;
  deployment_trigger: {
    metadata?: { branch?: string; commit_hash?: string; commit_message?: string };
  };
  aliases: string[] | null;
};

async function fetchDeployments(): Promise<Deployment[]> {
  let res: Response;
  try {
    res = await fetch(`${API}?per_page=25`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    fail(`Network error reaching the Cloudflare API: ${(e as Error).message}`);
  }

  const body = (await res.json().catch(() => null)) as {
    success: boolean;
    result?: Deployment[];
    errors?: { code: number; message: string }[];
  } | null;

  if (!res.ok || !body?.success) {
    const apiErrors = body?.errors?.map((e) => `[${e.code}] ${e.message}`).join('; ');
    if (res.status === 401 || res.status === 403) {
      fail(
        `Cloudflare rejected the token (HTTP ${res.status}).\n` +
          `${apiErrors ? `API says: ${apiErrors}\n` : ''}` +
          `Make sure CLOUDFLARE_API_TOKEN has the "Account -> Cloudflare Pages -> Read"\n` +
          `permission and that CLOUDFLARE_ACCOUNT_ID matches the account that owns it.`
      );
    }
    if (res.status === 404) {
      fail(
        `Project "${project}" not found in account ${accountId} (HTTP 404).\n` +
          `${apiErrors ? `API says: ${apiErrors}\n` : ''}` +
          `Check CLOUDFLARE_PAGES_PROJECT and CLOUDFLARE_ACCOUNT_ID.`
      );
    }
    fail(`Cloudflare API error (HTTP ${res.status}): ${apiErrors || 'unknown error'}`);
  }

  return body.result ?? [];
}

// ---- formatting ------------------------------------------------------------

const ICON: Record<string, string> = {
  success: '✅',
  failure: '❌',
  canceled: '⚪',
  skipped: '⏭️ ',
  active: '🔵',
  building: '🔨',
  deploying: '🚀',
  queued: '⏳',
  initialize: '⏳',
};

function shorten(s: string | undefined, n: number): string {
  if (!s) return '';
  const oneLine = s.split('\n')[0];
  return oneLine.length > n ? oneLine.slice(0, n - 1) + '…' : oneLine;
}

function describe(d: Deployment): string {
  const branch = d.deployment_trigger?.metadata?.branch ?? '(unknown)';
  const commit = (d.deployment_trigger?.metadata?.commit_hash ?? '').slice(0, 7);
  const msg = shorten(d.deployment_trigger?.metadata?.commit_message, 50);
  const stage = d.latest_stage?.name ?? '?';
  const status = d.latest_stage?.status ?? '?';
  const icon = ICON[status] ?? '•';
  const env = d.environment === 'production' ? 'prod   ' : 'preview';
  return (
    `${icon} ${status.padEnd(9)} ${env}  ${branch.padEnd(24)} ${commit}  ` +
    `${stage.padEnd(11)}  ${d.url}\n        ${msg}`
  );
}

/** Keep only the most recent deployment per branch. */
function latestPerBranch(deployments: Deployment[]): Deployment[] {
  const seen = new Map<string, Deployment>();
  for (const d of deployments) {
    const b = d.deployment_trigger?.metadata?.branch ?? d.id;
    if (!seen.has(b)) seen.set(b, d); // API returns newest-first
  }
  return [...seen.values()];
}

// ---- main ------------------------------------------------------------------

async function snapshot(): Promise<Deployment | undefined> {
  let deployments = await fetchDeployments();

  if (branchArg) {
    deployments = deployments.filter((d) => d.deployment_trigger?.metadata?.branch === branchArg);
    if (deployments.length === 0) {
      console.log(`No deployments found for branch "${branchArg}" (showing latest 25).`);
      return undefined;
    }
  }

  if (asJson) {
    console.log(JSON.stringify(branchArg ? deployments[0] : deployments, null, 2));
    return branchArg ? deployments[0] : undefined;
  }

  const rows = branchArg || showAll ? deployments : latestPerBranch(deployments);

  console.log(`\nCloudflare Pages — project "${project}"\n`);
  for (const d of rows) console.log(describe(d) + '\n');

  return branchArg ? deployments[0] : undefined;
}

async function main() {
  if (!watch) {
    await snapshot();
    return;
  }

  if (!branchArg) {
    fail('--watch requires a branch argument, e.g.  --watch master');
  }

  // Poll until the matched branch's latest deployment is terminal.
  while (true) {
    const d = await snapshot();
    const status = d?.latest_stage?.status;
    if (status && TERMINAL.has(status)) {
      process.exit(status === 'success' ? 0 : 1);
    }
    console.log(`… still ${status ?? 'pending'}, re-checking in 15s (Ctrl-C to stop)\n`);
    await new Promise((r) => setTimeout(r, 15_000));
  }
}

main();
