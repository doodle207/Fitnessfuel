FROM node:22-alpine
RUN npm install -g pnpm typescript
WORKDIR /app/artifacts/api-server
COPY artifacts/api-server/package.json .
COPY artifacts/api-server/tsconfig.json .
COPY artifacts/api-server/build.ts .
COPY artifacts/api-server/src ./src
RUN pnpm install --no-frozen-lockfile
RUN pnpm build
CMD ["node", "./dist/index.js"]
