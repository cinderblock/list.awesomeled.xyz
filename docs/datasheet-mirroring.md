# Datasheet mirroring (Cloudflare R2)

Datasheet PDFs are **not** stored in git. Each entry records:

- `datasheet.url` — the original URL at the manufacturer/author (attribution;
  the only thing a contributor needs to provide). It must be a **direct PDF**,
  not a product page or an HTML viewer.
- `datasheet.sources` — optional alternate hosts (`host: manufacturer |
distributor | community`), tried by the mirror when `url` fails.
- `datasheet.mirror` — a CI-managed copy on Cloudflare R2:

```yaml
datasheet:
  url: https://cdn-shop.adafruit.com/datasheets/APA102.pdf
  mirror:
    url: https://assets.awesomeled.xyz/datasheets/pixels/apa102-3f9c1a2b.pdf
    sha256: 3f9c1a2b... # full 64-char hash
    retrieved: '2026-06-13'
    source: https://cdn-shop.adafruit.com/datasheets/APA102.pdf
    fetched_from: https://... # only when `url` failed and a `sources` copy was used
```

The `datasheet` block is shared (`common.json#/definitions/datasheet`) by
pixels, pixel ICs, level converters, connectors, microboards and pixel decoders.

## Flow

1. A contributor adds/changes `datasheet.url` in a normal PR. No secrets, no
   special tooling — fork PRs work. `bun run mirror-datasheets --check --only
<category>/<id>` confirms the URL really downloads as a PDF.
2. After merge, `.github/workflows/mirror-datasheets.yml` runs
   `bun run mirror-datasheets`, which finds every entry whose `datasheet.url`
   differs from `datasheet.mirror.source` (or has no mirror), downloads the PDF
   (`%PDF-` magic check, 50 MB cap; falls back to each `datasheet.sources` URL),
   uploads it to R2 under `datasheets/<category>/<id>-<sha8>.pdf`, and writes the
   `datasheet.mirror` block into the YAML (prettier + validate run afterwards).
3. The workflow opens a bot PR (`ci/mirror-datasheets`) listing what was
   mirrored. The maintainer reviews and merges — that's the approval step.
   Merge with **Rebase and merge** (or keep the trailer in a squash message): the
   bot commit carries `Not-A-Review: datasheet mirror references (CI)`, which
   `app/lib/data.ts` honors so mirrored rows keep their "Reviewed" dates.

Changing a `datasheet.url` later re-mirrors automatically (the `source` field no
longer matches). Objects are content-addressed (`-<sha8>` suffix), so nothing is
overwritten; stale objects can be cleaned up in R2 at leisure.

PRs opened by the workflow's default `GITHUB_TOKEN` don't trigger other
workflows, so the bot PR shows no CI checks; the mirror job already ran
prettier and `bun run validate` on its output.

## Local use

```sh
bun run mirror-datasheets --check            # download + PDF-check every datasheet (no upload, no writes)
bun run mirror-datasheets --check --only pixels/apa102
bun run mirror-datasheets --dry-run          # list what would be mirrored
bun run mirror-datasheets --limit 3          # mirror a few (needs the R2 env vars)
```

Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
`R2_PUBLIC_BASE_URL`; optional `R2_ENDPOINT` (any S3-compatible endpoint — the
unit test points it at a local mock) and `MIRROR_SUMMARY_FILE`.

`tests/unit/mirror-datasheets.test.ts` (`bun run test:unit`) runs the whole CLI
against a local PDF host and a mock S3 endpoint: uploads, keys, content type,
the YAML it writes, the `sources` fallback, and failures leaving YAML untouched.

## One-time setup (Cloudflare + GitHub — owner only)

Until these exist the workflow no-ops cleanly (no red CI). Free in practice: R2's
free tier (10 GB-month, 1M writes, 10M reads, zero egress) dwarfs ~150 PDFs of
~1 MB, and Actions minutes are free on this public repo.

Proposed names: bucket `awesomeled-datasheets`, public domain
`assets.awesomeled.xyz`.

1. **Bucket.** Declared in the ops IaC (`cinderblock/ops`,
   `cloudflare/config/projects/awesomeled.yaml`):

   ```yaml
   # Datasheet mirror for list.awesomeled.xyz (scripts/mirror-datasheets.ts writes it from CI)
   - r2: awesomeled-datasheets
   ```

2. **Public access.** Connect `assets.awesomeled.xyz` as the bucket's custom
   domain (R2 → bucket → Settings → Custom Domains). The ops IaC has no R2
   custom-domain support yet, and its DNS sync manages the `awesomeled.xyz`
   zone, so a dashboard-made domain record needs to be declared there as
   externally managed (or the IaC taught R2 domains) before the next sync, or
   the sync may try to remove it. The `r2.dev` URL works for testing but is
   rate-limited and not meant for production.
3. **Credentials.** An **account-owned** R2 API token
   ([R2 → Manage API tokens](https://dash.cloudflare.com/?to=/:account/r2/api-tokens)
   → _Create Account API token_): permission _Object Read & Write_, scoped to
   the one bucket. It yields an Access Key ID and Secret Access Key.
4. **Repository secrets** ([Settings → Secrets and variables → Actions](https://github.com/cinderblock/list.awesomeled.xyz/settings/secrets/actions)):

   | Secret                 | Value                   |
   | ---------------------- | ----------------------- |
   | `R2_ACCOUNT_ID`        | Cloudflare account ID   |
   | `R2_ACCESS_KEY_ID`     | from step 3             |
   | `R2_SECRET_ACCESS_KEY` | from step 3             |
   | `R2_BUCKET`            | `awesomeled-datasheets` |

   and the **variable** `R2_PUBLIC_BASE_URL` = `https://assets.awesomeled.xyz`.

5. **Bot PRs.** [Settings → Actions → General](https://github.com/cinderblock/list.awesomeled.xyz/settings/actions)
   → _Workflow permissions_ → enable _Allow GitHub Actions to create and approve
   pull requests_.
6. **First run.** Actions → _Mirror datasheets to R2_ → _Run workflow_
   (`workflow_dispatch`), then review and rebase-merge the bot PR.

## Images (for contrast)

Images are the opposite policy: optimized **WebP** files committed straight into
`public/database-images/<category>/`, served at `/database-images/...`, processed
with `scripts/crop-image.ts` (usually via `bun run add-image`, which also writes
the `{file, source, credit, license}` attribution). Thumbnails are derived at
build time (`scripts/thumbs.ts`), never committed. No LFS, no external host —
they're small and PR-friendly.
