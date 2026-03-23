#!/bin/bash
set -e

echo "==> Node version: $(node --version)"

# Install exact pnpm version matching the lockfile
npm install -g pnpm@10

echo "==> pnpm version: $(pnpm --version)"

# Install all workspace dependencies (no frozen lockfile for Cloudflare env)
pnpm install --no-frozen-lockfile

echo "==> Building CaloForgeX frontend (Vite only, no typecheck)..."
# Run vite build directly — skips the root typecheck step
cd artifacts/fitness-app && npx vite build --config vite.config.ts

echo "==> Done! Output: artifacts/fitness-app/dist/public"
