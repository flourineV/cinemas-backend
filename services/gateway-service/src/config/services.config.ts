import { ServiceConfig } from "../types";

export const servicesConfig: Record<string, ServiceConfig> = {
  auth: {
    baseUrl: process.env.AUTH_SERVICE_URL || "http://auth-service:8081",
    timeout: 30000,
  },
  userProfile: {
    baseUrl:
      process.env.USER_PROFILE_SERVICE_URL ||
      "http://user-profile-service:8082",
    timeout: 30000,
  },
  movie: {
    baseUrl: process.env.MOVIE_SERVICE_URL || "http://movie-service:8083",
    timeout: 30000,
  },
  showtime: {
    baseUrl: process.env.SHOWTIME_SERVICE_URL || "http://showtime-service:8084",
    timeout: 30000,
  },
  booking: {
    baseUrl: process.env.BOOKING_SERVICE_URL || "http://booking-service:8085",
    timeout: 30000,
  },
  payment: {
    baseUrl: process.env.PAYMENT_SERVICE_URL || "http://payment-service:8086",
    timeout: 30000,
  },
  pricing: {
    baseUrl: process.env.PRICING_SERVICE_URL || "http://pricing-service:8087",
    timeout: 30000,
  },
  fnb: {
    baseUrl: process.env.FNB_SERVICE_URL || "http://fnb-service:8088",
    timeout: 30000,
  },
  promotion: {
    baseUrl:
      process.env.PROMOTION_SERVICE_URL || "http://promotion-service:8089",
    timeout: 30000,
  },
  notification: {
    baseUrl:
      process.env.NOTIFICATION_SERVICE_URL ||
      "http://notification-service:8090",
    timeout: 30000,
  },
};
