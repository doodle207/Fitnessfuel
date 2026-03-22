import app from "./app";
import { initDatabase } from "./dbInit";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Initialize DB schema and seed on startup (safe to run every time — uses IF NOT EXISTS)
initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}).catch((err) => {
  console.error("Fatal: could not initialize database", err);
  // Start server anyway — auth and health checks still need to work
  app.listen(port, () => {
    console.log(`Server listening on port ${port} (DB init failed — some features may be unavailable)`);
  });
});
