#!/bin/bash
set -e

echo "==> Node version: $(node --version)"

npm install -g pnpm@10

echo "==> pnpm version: $(pnpm --version)"

pnpm install --no-frozen-lockfile

echo "==> Building CaloForgeX frontend (Vite only, no typecheck)..."
cd artifacts/fitness-app && npx vite build --config vite.config.ts

echo "==> Done! Output: artifacts/fitness-app/dist/public"
