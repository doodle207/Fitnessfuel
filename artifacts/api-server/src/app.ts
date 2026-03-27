import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";

const app: Express = express();

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[API Error]", err?.message ?? err);
  const status = err?.status ?? err?.statusCode ?? 500;
  const message = err?.message ?? "Internal server error";
  res.status(status).json({ error: message });
});

if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(
    process.cwd(),
    "artifacts/fitness-app/dist/public",
  );

  app.use(express.static(frontendDist));

  app.get("*path", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
