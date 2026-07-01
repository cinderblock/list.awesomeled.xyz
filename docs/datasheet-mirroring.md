# Datasheet mirroring (Cloudflare R2)

Datasheet PDFs are **not** stored in git. Each entry records:

- `datasheet.url` — the original URL at the manufacturer/author (attribution;
  the only thing a contributor needs to provide).
- `datasheet.mirror` — a CI-managed copy on Cloudflare R2:

```yaml
datasheet:
  url: https://cdn-shop.adafruit.com/datasheets/APA102.pdf
  mirror:
    url: https://assets.awesomeledlist.com/datasheets/pixel-ics/apa102-3f9c1a2b.pdf
    sha256: 3f9c1a2b... # full 64-char hash
    retrieved: '2026-06-13'
    source: https://cdn-shop.adafruit.com/datasheets/APA102.pdf
```

## Flow

1. A contributor adds/changes `datasheet.url` in a normal PR. No secrets, no
   special tooling — fork PRs work.
2. After merge, `.github/workflows/mirror-datasheets.yml` runs
   `bun run mirror-datasheets`, which finds every entry whose `datasheet.url`
   differs from `datasheet.mirror.source` (or has no mirror), downloads the PDF
   (with a `%PDF-` magic check and 50 MB cap), uploads it to R2 under
   `datasheets/<category>/<id>-<sha8>.pdf`, and writes the `datasheet.mirror`
   block into the YAML.
3. The workflow opens a bot PR (`ci/mirror-datasheets`) listing what was
   mirrored. The maintainer reviews and merges — that's the approval step.

Changing a `datasheet.url` later re-mirrors automatically (the `source` field no
longer matches). Objects are content-addressed (`-<sha8>` suffix), so nothing is
overwritten; stale objects can be cleaned up in R2 at leisure.

## One-time setup

Repository **secrets**:

| Secret                                      | Value                                            |
| ------------------------------------------- | ------------------------------------------------ |
| `R2_ACCOUNT_ID`                             | Cloudflare account ID                            |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 API token (Object Read & Write on the bucket) |
| `R2_BUCKET`                                 | bucket name                                      |

Repository **variable**:

| Variable             | Value                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `R2_PUBLIC_BASE_URL` | public base of the bucket, e.g. `https://assets.awesomeledlist.com` (custom domain) or the `r2.dev` URL |

Also enable _Settings → Actions → General → Allow GitHub Actions to create and
approve pull requests_, or the bot PR step fails. Until the secrets exist the
workflow no-ops cleanly (no red CI).

## Local use

```sh
bun run mirror-datasheets --dry-run   # list what would be mirrored
bun run mirror-datasheets --limit 3   # mirror a few (needs R2 env vars)
```

## Images (for contrast)

Images are the opposite policy: optimized **WebP** files committed straight into
`public/database-images/<category>/`, served at `/database-images/...`, processed
with `scripts/crop-image.ts`. No LFS, no external host — they're small and PR-friendly.
