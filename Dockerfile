FROM node:22-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN ls -la
RUN find . -name "package.json" -not -path "*/node_modules/*" -maxdepth 3
CMD ["sh", "-c", "echo starting"]
