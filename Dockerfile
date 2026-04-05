# Use Node.js LTS version
FROM node:16

# Set the working directory
WORKDIR /app

# Copy only the API server files
COPY artifacts/api-server ./

# Install dependencies
RUN npm install

# Build the project
RUN npm run build

# Start the application
CMD ["node", "dist/index.js"]