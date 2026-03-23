#!/bin/bash
set -e

echo "==> Installing pnpm..."
npm install -g pnpm@10

echo "==> Installing workspace dependencies..."
pnpm install --no-frozen-lockfile

echo "==> Building fitness app..."
pnpm --filter @workspace/fitness-app run build

echo "==> Build complete! Output: artifacts/fitness-app/dist/public"
