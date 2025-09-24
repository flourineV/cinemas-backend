# 🎬 Cinemas API Gateway (Task 3)

Gateway là **single entrypoint** cho toàn bộ backend. Đảm nhiệm: **forward requests**, **JWT**, **RBAC**, **rate-limit**, **CORS/Helmet/Compression**, **logging**, **health**.

## Tính năng chính

- **/api** prefix: route đến từng service (auth, catalog, user, showtime, booking, payment, notification).
- **JWT**: đọc token (hỗ trợ payload `{ sub, role }` hoặc `{ id }`), gắn xuống upstream headers:
  - `x-user-id`, `x-user-role`, `x-request-id`.
- **RBAC** helper: `requireRole('STAFF','ADMIN')`.
- **Rate limit**: 600 req/phút (config được).
- **CORS + Helmet + Compression**: theo `CORS_ORIGINS`.
- **Logging**: morgan + winston, có `req_id`.
- **Health**: `GET /health` (gateway) + `GET /api/<service>/health` (rewrite `/` → `/health`).

## Cấu trúc

src/
├─ server.ts # entrypoint, mount /api, health, middlewares
├─ routes.ts # định tuyến + pathRewrite
├─ config/
│ └─ index.ts # đọc ENV (PORT, JWT_SECRET, service URLs)
├─ proxy/
│ └─ createProxy.ts # http-proxy-middleware v3 (on.proxyReq/error)
├─ middlewares/
│ ├─ auth.ts # jwtOptional / jwtRequired
│ ├─ rbac.ts # requireRole(...)
│ ├─ rateLimit.ts # 600 req/min
│ ├─ cors.ts # CORS theo env
│ ├─ logging.ts # morgan + winston
│ └─ error.ts # 404 + error handler
├─ utils/
│ └─ requestContext.ts # gắn req.reqId (UUID)
└─ types/
└─ index.d.ts # mở rộng Express.Request (user, reqId)

markdown
Sao chép mã

> Dự án chạy **ESM**: import nội bộ cần có **đuôi `.js`** (vd: `../config/index.js`) để Node resolve file trong `dist/`.

## ENV cần thiết

| Key                                   | Ví dụ                                                             |
| ------------------------------------- | ----------------------------------------------------------------- |
| `PORT`                                | `3000`                                                            |
| `JWT_SECRET`                          | `your-super-secret-jwt-key-for-auth-service` (**trùng với Auth**) |
| `REQUEST_TIMEOUT_MS`                  | `8000`                                                            |
| `CORS_ORIGINS`                        | `http://localhost:3000,http://localhost:5173`                     |
| `AUTH_SERVICE_URL`                    | `http://auth-service:3001`                                        |
| `CATALOG_SERVICE_URL`                 | `http://catalog-service:3002`                                     |
| (optional) `USER_PROFILE_SERVICE_URL` | `http://user-profile-service:3007`                                |
| (optional) `SHOWTIME_SERVICE_URL`     | `http://showtime-service:3003`                                    |
| (optional) `BOOKING_SERVICE_URL`      | `http://booking-service:3004`                                     |
| (optional) `PAYMENT_SERVICE_URL`      | `http://payment-service:3005`                                     |
| (optional) `NOTIFICATION_SERVICE_URL` | `http://notification-service:3006`                                |

Tạo `.env` từ mẫu: **`.env.example`**.

## Chạy bằng Docker

- `docker compose build api-gateway`
- `docker compose up -d api-gateway` _(nếu chưa có các service khác, dùng `--no-deps` hoặc stub local)_

## Endpoints qua Gateway

- `GET /` → info gateway
- `GET /health` → `{ ok: true }`
- Auth: `POST /api/auth/{register|login|refresh|logout}`, `GET /api/auth/health`
- Catalog: `GET /api/catalog/{movies,movies/:id,cinemas,showtimes}`, `GET /api/catalog/health`

## Test nhanh

```bash
curl http://localhost:3000
curl http://localhost:3000/health
curl http://localhost:3000/api/auth/health
curl http://localhost:3000/api/catalog/health
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{}"
curl http://localhost:3000/api/catalog/movies
```
