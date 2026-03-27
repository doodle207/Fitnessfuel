import app from "../artifacts/api-server/src/app";
import { initDatabase } from "../artifacts/api-server/src/dbInit";

initDatabase().catch((err: unknown) => {
  console.error(
    "[API] Database initialization failed:",
    err instanceof Error ? err.message : err,
  );
});

export default app;
