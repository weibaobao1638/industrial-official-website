#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/ubuntu/industrial-official-website"
BRANCH="main"
PM2_APP_NAME="industrial-site"
APP_PORT="3000"
HEALTHCHECK_URL="http://127.0.0.1:${APP_PORT}/en"
REVALIDATE_URL="http://127.0.0.1:${APP_PORT}/api/revalidate"

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

require_cmd git
require_cmd corepack
require_cmd pm2
require_cmd curl

cd "$APP_DIR"

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  log "Tracked local changes detected. Commit or stash them before deploying."
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  log "Current branch is '$CURRENT_BRANCH', expected '$BRANCH'."
  exit 1
fi

log "Pulling latest code from origin/${BRANCH}"
git pull --ff-only origin "$BRANCH"

log "Installing dependencies"
corepack pnpm install --frozen-lockfile

log "Clearing Next.js build cache"
rm -rf .next

log "Building production bundle"
corepack pnpm build

if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  log "Restarting PM2 app: $PM2_APP_NAME"
  pm2 restart "$PM2_APP_NAME"
else
  log "Starting PM2 app: $PM2_APP_NAME"
  pm2 start /usr/bin/bash \
    --name "$PM2_APP_NAME" \
    --cwd "$APP_DIR" \
    -- -lc "exec corepack pnpm exec next start --hostname 0.0.0.0 --port ${APP_PORT}"
fi

log "Saving PM2 process list"
pm2 save

log "Checking application health"
HTTP_STATUS="$(curl -sS -o /dev/null -w '%{http_code}' "$HEALTHCHECK_URL")"
if [[ "$HTTP_STATUS" != "200" && "$HTTP_STATUS" != "307" ]]; then
  log "Health check failed: ${HEALTHCHECK_URL} returned ${HTTP_STATUS}"
  exit 1
fi

REVALIDATE_SECRET="$(grep '^REVALIDATE_SECRET=' .env.local | cut -d= -f2- || true)"
if [[ -n "$REVALIDATE_SECRET" ]]; then
  log "Triggering frontend revalidation"
  curl -sS -X POST "$REVALIDATE_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"secret\":\"${REVALIDATE_SECRET}\",\"paths\":[\"/\",\"/zh\",\"/en\"],\"tags\":[\"site_settings\",\"pages\",\"products\",\"product_categories\",\"industries\",\"case_studies\",\"blog_posts\",\"downloads\",\"certifications\",\"home_banners\"]}" \
    >/dev/null
fi

log "Deployment completed successfully"
log "Health check: ${HEALTHCHECK_URL} -> ${HTTP_STATUS}"
