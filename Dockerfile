FROM node:22-bookworm-slim
RUN npm install -g pnpm typescript
WORKDIR /app
COPY pnpm-workspace.yaml .
COPY package.json .
COPY tsconfig.base.json .
COPY pnpm-lock.yaml* .
COPY lib/ ./lib/
COPY attached_assets/ ./attached_assets/
COPY artifacts/api-server/ ./artifacts/api-server/
COPY artifacts/fitness-app/ ./artifacts/fitness-app/
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @workspace/fitness-app build
RUN pnpm --filter @workspace/api-server build
CMD ["node", "./artifacts/api-server/dist/index.cjs"]
