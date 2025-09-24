import cors, { type CorsOptions } from "cors";
import { config } from "../config/index.js";

// Dùng đúng kiểu của cors cho origin callback
const originCheck: NonNullable<CorsOptions["origin"]> = (origin, cb) => {
  // Cho phép curl/Postman (origin = undefined)
  if (!origin) return cb(null, true);
  if (config.corsOrigins.length === 0 || config.corsOrigins.includes(origin)) {
    return cb(null, true);
  }
  return cb(new Error("CORS not allowed"));
};

export const corsMiddleware = cors({
  origin: originCheck,
  credentials: true,
});
