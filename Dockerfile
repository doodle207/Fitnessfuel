FROM node:22-alpine
RUN npm install -g pnpm typescript
WORKDIR /app
COPY pnpm-workspace.yaml .
COPY package.json .
COPY tsconfig.base.json .
COPY pnpm-lock.yaml* .
# Use trailing slashes to avoid Render/Docker layer cache oddities
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @workspace/api-server build
CMD ["node", "./artifacts/api-server/dist/index.cjs"]
