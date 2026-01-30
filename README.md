# HN → Action

Human-curated AI discussions from Hacker News and Reddit, turned into short, actionable Build This experiments.

## Admin Usage (MVP)

### Set the admin password

Set `ADMIN_PASSWORD` in your environment before starting Next.js.

Example (macOS/Linux):

```
export ADMIN_PASSWORD="your-strong-password"
```

### Admin flow

1. Visit `/admin`.
2. Sign in with the password.
3. Approve or reject items in `data/pending.json`.

### Seed demo items

On `/admin`, use the “Seed 3 demo items” button to add sample pending items for testing.

### Approval requirements

To approve a pending item you must provide:

- Why this matters (2–3 lines)
- Try this (action steps or a repo link)
- Time estimate (15m, 30m, 2h)
- Tags (comma-separated)

Approved items move to `data/published.json` and appear on the public homepage.

## Ingestion (local)

Run the ingestion script manually:

```
node scripts/fetch.mjs
```

## Ingestion config

Edit `data/ingest-config.json` to tune HN keywords, HN hits per page, and Reddit subreddits.

Example:

```
{
  "hn": { "keywords": ["agents", "evals"], "hitsPerPage": 20 },
  "reddit": { "subreddits": ["LocalLLaMA", "OpenAI"] }
}
```

## Tests (sample)

Run sample utility tests:

```
node scripts/test-utils.mjs
```

## Deploy (Netlify)

Netlify supports the Next.js runtime and server actions.

1. Connect the repo in Netlify and keep the default Next.js settings.
2. Set `ADMIN_PASSWORD` in the Netlify environment.
3. Ingestion should run via GitHub Actions (recommended), which updates `data/` in the repo.

If you want a fully static export, you’ll need to remove the admin UI/server actions and handle publishing locally.
