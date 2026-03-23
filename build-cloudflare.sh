#!/bin/bash
set -e

echo "==> Node version: $(node --version)"
echo "==> NPM version: $(npm --version)"

# Install exact pnpm version matching the lockfile
npm install -g pnpm@10

echo "==> pnpm version: $(pnpm --version)"

# Install all workspace dependencies
pnpm install --no-frozen-lockfile

echo "==> Building CaloForgeX frontend..."
pnpm --filter @workspace/fitness-app run build

echo "==> Done! Output: artifacts/fitness-app/dist/public"
