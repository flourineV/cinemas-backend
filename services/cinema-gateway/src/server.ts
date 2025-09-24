import express from "express";
import helmet from "helmet";
import compression from "compression";
import { config } from "./config/index.js";
import { attachRequestId } from "./utils/requestContext.js";
import { httpLogger } from "./middlewares/logging.js";
import { corsMiddleware } from "./middlewares/cors.js";
import { createRateLimiter } from "./middlewares/rateLimit.js";
import { buildRoutes } from "./routes.js";
import { errorHandler, notFound } from "./middlewares/error.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(compression());
app.use(attachRequestId);
app.use(httpLogger);

// Root info
app.get("/", (_req, res) => {
  res.json({
    name: "Cinemas API Gateway",
    env: config.env,
    health: "/health",
    api_prefix: "/api",
    services: {
      auth: "/api/auth/*",
      catalog: "/api/catalog/*",
      user: "/api/user/*",
      showtime: "/api/showtime/*",
      booking: "/api/booking/*",
      payment: "/api/payment/* (webhook public: /api/payment/webhook)",
      notification: "/api/notification/*",
    },
  });
});

// Gateway health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Rate limit
app.use(createRateLimiter(60_000, 600));

// Mount all API under /api
app.use("/api", buildRoutes());

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on :${config.port} (${config.env})`);
});
