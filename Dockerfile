FROM node:22-alpine
RUN npm install -g pnpm typescript
WORKDIR /app
COPY . .
WORKDIR /app/artifacts/api-server
RUN pnpm install --no-frozen-lockfile
RUN pnpm build
CMD ["node", "./dist/index.js"]
