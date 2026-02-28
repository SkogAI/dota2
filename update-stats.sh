#!/usr/bin/env bash
# Update Dota 2 Squad Stats - fetches fresh data from OpenDota and rebuilds everything
set -euo pipefail

cd "$(dirname "$0")"

echo "=== Dota 2 Squad Stats Updater ==="
echo ""

# Check for node
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js required. Install from https://nodejs.org"
  exit 1
fi

echo "[1/3] Fetching fresh data from OpenDota API..."
node update-stats.js

echo ""
echo "[2/3] Rebuilding worker bundle..."
node rebuild-bundle.js

echo ""
echo "[3/3] Done! Files updated:"
echo "  - squad-stats.html"
echo "  - worker-bundle.js"
echo ""

# Optional deploy
if [[ "${1:-}" == "--deploy" ]]; then
  echo "Deploying to Cloudflare Workers..."
  npx wrangler deploy
  echo ""
  echo "Live at: https://dota2-helper.skogai.workers.dev"
elif [[ "${1:-}" == "--push" ]]; then
  echo "Committing and pushing..."
  git add squad-stats.html worker-bundle.js
  git commit -m "Update squad stats - $(date +%Y-%m-%d)"
  git push origin master
  echo ""
  echo "Deploying to Cloudflare Workers..."
  npx wrangler deploy
  echo ""
  echo "Live at: https://dota2-helper.skogai.workers.dev"
else
  echo "Run with --deploy to deploy, or --push to commit+push+deploy"
fi
