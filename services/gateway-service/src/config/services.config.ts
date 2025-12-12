import { ServiceConfig } from "../types";

export const servicesConfig: Record<string, ServiceConfig> = {
  auth: {
    // Sửa auth-service -> localhost
    baseUrl: process.env.AUTH_SERVICE_URL || "http://localhost:8081/api/auth",
    timeout: 30000,
  },
  userProfile: {
    baseUrl:
      process.env.USER_PROFILE_SERVICE_URL ||
      "http://localhost:8082/api/profiles", // Sửa user-profile-service -> localhost
    timeout: 30000,
  },
  movie: {
    baseUrl:
      process.env.MOVIE_SERVICE_URL || "http://localhost:8083/api/movies",
    timeout: 30000,
  },
  showtime: {
    baseUrl:
      process.env.SHOWTIME_SERVICE_URL || "http://localhost:8084/api/showtimes",
    timeout: 30000,
  },
  booking: {
    baseUrl:
      process.env.BOOKING_SERVICE_URL || "http://localhost:8085/api/bookings",
    timeout: 30000,
  },
  payment: {
    baseUrl:
      process.env.PAYMENT_SERVICE_URL || "http://localhost:8086/api/payments",
    timeout: 30000,
  },
  pricing: {
    baseUrl:
      process.env.PRICING_SERVICE_URL || "http://localhost:8087/api/pricing",
    timeout: 30000,
  },
  fnb: {
    baseUrl: process.env.FNB_SERVICE_URL || "http://localhost:8088/api/fnb",
    timeout: 30000,
  },
  promotion: {
    baseUrl:
      process.env.PROMOTION_SERVICE_URL ||
      "http://localhost:8089/api/promotions",
    timeout: 30000,
  },
  notification: {
    baseUrl:
      process.env.NOTIFICATION_SERVICE_URL ||
      "http://localhost:8090/api/notifications",
    timeout: 30000,
  },
  review: {
    baseUrl:
      process.env.REVIEW_SERVICE_URL || "http://localhost:8091/api/reviews",
    timeout: 30000,
  },
};
