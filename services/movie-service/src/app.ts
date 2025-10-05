import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import { loggerHttp } from "./middlewares/logger";
import { notFound, errorHandler } from "./middlewares/errors";
import routes from "./routes";
import { config } from "./config";

export function createApp() {
  const app = express();

  // middlewares cơ bản trước
  app.use(helmet());
  app.use(compression());
  app.use(cors());
  app.use(express.json());
  app.use(loggerHttp);

  // health check
  app.get("/healthz", (_req, res) =>
    res.json({ status: "ok", service: config.serviceName })
  );

  // chỉ mount routes 1 lần dưới /api
  app.use("/api", routes);

  // 404 + error handler luôn để cuối
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
