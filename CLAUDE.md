# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Dota 2 Squad Hub — a Cloudflare Worker that serves static HTML pages with Dota 2 stats for a friend group. Data comes from the OpenDota API.

## Architecture

- **HTML source files**: `squad-stats.html`, `skogix-dota2-stats.html`, `dota2-draft-helper.html`, `worst-matches.html` — these are the actual pages
- **worker-bundle.js**: Generated file — DO NOT edit directly. It's built by `rebuild-bundle.js` which inlines all HTML files into a single Worker script
- **rebuild-bundle.js**: Reads the HTML files and produces `worker-bundle.js`
- **update-stats.js**: Fetches fresh data from OpenDota API and updates `squad-stats.html` (and related files)
- **wrangler.json**: Cloudflare Worker config

## Commands

- `./update-stats.sh` — fetch fresh OpenDota data + rebuild worker bundle
- `./update-stats.sh --deploy` — same + deploy to Cloudflare Workers
- `./update-stats.sh --push` — same + git commit + push + deploy
- `node rebuild-bundle.js` — rebuild worker-bundle.js from HTML sources (no API fetch)
- `npm run dev` — local dev server via wrangler
- `npm run deploy` — deploy to Cloudflare Workers

## Linting

- `npx eslint <file>` — lint JS files (eslint.config.js configured)
- `worker-bundle.js` is excluded from linting (generated file)
- Pre-commit hook runs eslint on staged JS files and checks bundle is in sync

## Important

- After editing any `.html` file, run `node rebuild-bundle.js` to regenerate `worker-bundle.js`
- The Worker proxies `/api/*` requests to OpenDota with 1-hour cache
- OpenDota API has rate limits — `update-stats.js` adds 250ms delays between requests
- Player IDs are hardcoded in `update-stats.js`
