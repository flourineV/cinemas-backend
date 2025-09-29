import { Router } from "express";
import { createServiceProxy } from "./proxy/createProxy.js";
import { config } from "./config/index.js";
import { jwtOptional, jwtRequired } from "./middlewares/auth.js";
import { requireRole } from "./middlewares/rbac.js";

export function buildRoutes() {
  const r = Router();

  // ================== HEALTH PROXIES (qua Gateway) ==================
  // r.use(
  //   "/auth/health",
  //   createServiceProxy({
  //     target: config.services.auth,
  //     pathRewrite: { "^/auth": "" }, // /api/auth/health -> /health
  //   })
  // );
  r.use(
    "/auth/health",
    createServiceProxy({
      target: config.services.auth,
      // Sau khi Express cắt '/auth/health', path còn lại là '/'
      pathRewrite: { "^/$": "/health" },
    })
  );
  // r.use(
  //   "/catalog/health",
  //   createServiceProxy({
  //     target: config.services.catalog,
  //     pathRewrite: { "^/catalog": "" }, // /api/catalog/health -> /health
  //   })
  // );
  r.use(
    "/catalog/health",
    createServiceProxy({
      target: config.services.catalog,
      pathRewrite: { "^/$": "/health" },
    })
  );
  r.use(
    "/user/health",
    createServiceProxy({
      target: config.services.userProfile,
      pathRewrite: { "^/user": "" }, // /api/user/health -> /health
    })
  );

  r.use(
    "/showtime/health",
    createServiceProxy({
      target: config.services.showtime,
      pathRewrite: { "^/showtime": "" }, // /api/showtime/health -> /health
    })
  );

  r.use(
    "/booking/health",
    createServiceProxy({
      target: config.services.booking,
      pathRewrite: { "^/booking": "" }, // /api/booking/health -> /health
    })
  );

  r.use(
    "/payment/health",
    createServiceProxy({
      target: config.services.payment,
      pathRewrite: { "^/payment": "" }, // /api/payment/health -> /health
    })
  );

  r.use(
    "/notification/health",
    createServiceProxy({
      target: config.services.notification,
      pathRewrite: { "^/notification": "" }, // /api/notification/health -> /health
    })
  );

  // ================== AUTH SERVICE ==================
  // POST /api/auth/register|login|refresh|logout ...
  r.use(
    "/auth",
    jwtOptional,
    createServiceProxy({
      target: config.services.auth,
      pathRewrite: { "^/auth": "" },
    })
  );

  // ================== CATALOG SERVICE ==================
  // GET /api/catalog/movies|movies/:id|cinemas|showtimes ...
  r.use(
    "/catalog",
    jwtOptional,
    createServiceProxy({
      target: config.services.catalog,
      pathRewrite: { "^/catalog": "" },
    })
  );

  // ================== USER-PROFILE SERVICE ==================
  // /api/user/me (GET/PUT), loyalty, rank... ⇒ yêu cầu đăng nhập
  r.use(
    "/user",
    jwtRequired,
    createServiceProxy({
      target: config.services.userProfile,
      pathRewrite: { "^/user": "" },
    })
  );

  // ================== SHOWTIME SERVICE ==================
  // GET public (lịch chiếu, ghế); các thao tác giữ ghế/CRUD do service tự kiểm tra role
  r.use(
    "/showtime",
    jwtOptional,
    createServiceProxy({
      target: config.services.showtime,
      pathRewrite: { "^/showtime": "" },
    })
  );

  // ================== BOOKING SERVICE ==================
  // Đặt vé ⇒ yêu cầu đăng nhập
  r.use(
    "/booking",
    jwtRequired,
    createServiceProxy({
      target: config.services.booking,
      pathRewrite: { "^/booking": "" },
    })
  );

  // ================== PAYMENT SERVICE ==================
  // Webhook public (ký HMAC ở service), các route còn lại yêu cầu đăng nhập
  r.use(
    "/payment/webhook",
    createServiceProxy({
      target: config.services.payment,
      pathRewrite: { "^/payment": "" }, // /api/payment/webhook -> /webhook
    })
  );
  r.use(
    "/payment",
    jwtRequired,
    createServiceProxy({
      target: config.services.payment,
      pathRewrite: { "^/payment": "" },
    })
  );

  // ================== NOTIFICATION SERVICE ==================
  // Thường là internal; ở đây để protected (có thể siết STAFF/ADMIN nếu cần)
  r.use(
    "/notification",
    jwtRequired,
    /* hoặc requireRole('STAFF','ADMIN'), */ createServiceProxy({
      target: config.services.notification,
      pathRewrite: { "^/notification": "" },
    })
  );

  // ================== ADMIN EXAMPLE ==================
  // Ví dụ gom route quản trị catalog dưới /api/admin/catalog/*
  r.use(
    "/admin/catalog",
    jwtRequired,
    requireRole("STAFF", "ADMIN"),
    createServiceProxy({
      target: config.services.catalog,
      pathRewrite: { "^/admin/catalog": "/admin" },
    })
  );

  return r;
}
