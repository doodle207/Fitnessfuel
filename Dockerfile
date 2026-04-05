FROM node:22-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN cd artifacts/api-server && pnpm install --no-frozen-lockfile && pnpm build
CMD ["sh", "-c", "cd artifacts/api-server && pnpm serve"]
