import "dotenv/config";

const getEnv = (k: string, d?: string) => {
  const v = process.env[k] ?? d;
  if (v === undefined) throw new Error(`Missing env: ${k}`);
  return v;
};

export const config = {
  env: getEnv("NODE_ENV", "development"),
  port: Number(getEnv("PORT", "3000")),
  jwtSecret: getEnv("JWT_SECRET"),
  requestTimeoutMs: Number(getEnv("REQUEST_TIMEOUT_MS", "8000")),
  proxyRetries: Number(getEnv("PROXY_RETRIES", "1")),
  corsOrigins: getEnv("CORS_ORIGINS", "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  services: {
    auth: getEnv("AUTH_SERVICE_URL"),
    catalog: getEnv("CATALOG_SERVICE_URL"),
    userProfile: getEnv(
      "USER_PROFILE_SERVICE_URL",
      "http://user-profile-service:3007"
    ),
    showtime: getEnv("SHOWTIME_SERVICE_URL", "http://showtime-service:3003"),
    booking: getEnv("BOOKING_SERVICE_URL", "http://booking-service:3004"),
    payment: getEnv("PAYMENT_SERVICE_URL", "http://payment-service:3005"),
    notification: getEnv(
      "NOTIFICATION_SERVICE_URL",
      "http://notification-service:3006"
    ),
  },
} as const;
