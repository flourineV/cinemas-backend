import { GatewayConfig } from "../types";
import { servicesConfig } from "./services.config";

export const gatewayConfig: GatewayConfig = {
  routes: [
    {
      id: "auth-service",
      path: "/api/auth",
      target: servicesConfig.auth.baseUrl,
      requireAuth: false, // Người làm auth service sẽ config lại nếu cần
    },
    {
      id: "user-profile-service",
      path: "/api/profiles",
      target: servicesConfig.userProfile.baseUrl,
      requireAuth: false, // Người làm user profile service sẽ config lại nếu cần
    },
    {
      id: "movie-service",
      path: "/api/movies",
      target: servicesConfig.movie.baseUrl,
      requireAuth: false, // Người làm movie service sẽ config lại nếu cần
    },
    {
      id: "showtime-service",
      path: "/api/showtimes",
      target: servicesConfig.showtime.baseUrl,
      requireAuth: false, // Người làm showtime service sẽ config lại nếu cần
    },
    {
      id: "booking-service",
      path: "/api/bookings",
      target: servicesConfig.booking.baseUrl,
      requireAuth: false, // Người làm booking service sẽ config lại nếu cần
    },
    {
      id: "payment-service",
      path: "/api/payments",
      target: servicesConfig.payment.baseUrl,
      requireAuth: false, // Người làm payment service sẽ config lại nếu cần
    },
    {
      id: "pricing-service",
      path: "/api/pricing",
      target: servicesConfig.pricing.baseUrl,
      requireAuth: false, // Người làm pricing service sẽ config lại nếu cần
    },
    {
      id: "fnb-service",
      path: "/api/fnb",
      target: servicesConfig.fnb.baseUrl,
      requireAuth: false, // Người làm fnb service sẽ config lại nếu cần
    },
    {
      id: "promotion-service",
      path: "/api/promotions",
      target: servicesConfig.promotion.baseUrl,
      requireAuth: false, // Người làm promotion service sẽ config lại nếu cần
    },
    {
      id: "notification-service",
      path: "/api/notifications",
      target: servicesConfig.notification.baseUrl,
      requireAuth: false, // Người làm notification service sẽ config lại nếu cần
    },
  ],
};
