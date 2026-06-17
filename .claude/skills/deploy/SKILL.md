---
name: deploy
description: Monitor this project's deploys. Cloudflare Pages is the primary public deploy (every push builds a branch/PR preview and master goes to production); GitHub Actions is the CI + GitHub Pages backup. Use when asked to check deploy status, watch a deploy, or find a preview URL.
---

# Deploy monitoring

## How deploys work here

Every push triggers **two independent systems**:

### 1. Cloudflare Pages — the primary public path
Cloudflare Pages is connected to the GitHub repo via Cloudflare's native Git
integration (it is *not* in `.github/workflows`). On every push it builds:

- **Production** (`master`) → the live public site.
- **Branch preview** for any branch → `https://<sanitized-branch>.pages.dev`
  (project: `awesomeledlist`, so `https://<branch>.awesomeledlist.pages.dev`).
- **Commit preview** → `https://<commit-sha>.awesomeledlist.pages.dev`.

Branch names are sanitized by Cloudflare: lowercased, non-alphanumerics → `-`,
truncated to 28 chars. `.github/workflows/preview-comment.yml` posts these URLs
on each PR.

Because this is Cloudflare's own pipeline, its status is **not visible to GitHub
or `gh`** — you must query the Cloudflare API. That's what `check-deploy.ts` does.

### 2. GitHub Actions — CI + backup
`.github/workflows/deploy.yml` runs on push to `master` and on PRs:
lint/typecheck → Playwright tests → build → **deploy to GitHub Pages** (backup
of the public site). This *is* visible to `gh`:

```sh
gh run list --workflow=deploy.yml --limit 5      # recent runs
gh run watch                                     # follow the latest run live
gh run view --log-failed                         # logs for a failed run
```

## Checking Cloudflare deploy status

### One-time setup (needs an API token)
```sh
cd .claude/skills/deploy
cp .env.example .env.local
# then edit .env.local and fill in the values
```

You need:
- **CLOUDFLARE_API_TOKEN** — token with `Account -> Cloudflare Pages -> Read`
  permission. Create at https://dash.cloudflare.com/profile/api-tokens
- **CLOUDFLARE_ACCOUNT_ID** — from the dashboard URL or Workers & Pages → Overview
- **CLOUDFLARE_PAGES_PROJECT** — optional, defaults to `awesomeledlist`

`.env.local` / `.env` are gitignored; only `.env.example` is committed. If the
token is missing the script prints exactly which var is missing and how to fix it.

### Usage
```sh
# Latest deployment per branch (production + active previews)
bun .claude/skills/deploy/check-deploy.ts

# Just one branch
bun .claude/skills/deploy/check-deploy.ts master
bun .claude/skills/deploy/check-deploy.ts rich-schema

# Watch a branch until its deploy finishes (polls every 15s; exit 0 = success)
bun .claude/skills/deploy/check-deploy.ts master --watch

# Raw JSON (for scripting) / every deployment on the first page
bun .claude/skills/deploy/check-deploy.ts master --json
bun .claude/skills/deploy/check-deploy.ts --all
```

Status icons: ✅ success · ❌ failure · 🔵 active · 🔨 building · 🚀 deploying ·
⏳ queued · ⚪ canceled · ⏭️ skipped.

## Typical flow after a push
1. `git push`
2. Watch Cloudflare (the public path):
   `bun .claude/skills/deploy/check-deploy.ts <branch> --watch`
3. Optionally confirm the GitHub CI/backup passed: `gh run watch`
4. Preview URL: `https://<sanitized-branch>.awesomeledlist.pages.dev`
