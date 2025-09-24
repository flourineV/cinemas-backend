import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "../config/index.js";

type ProxyOptions = { target: string; pathRewrite?: Record<string, string> };

export function createServiceProxy({ target, pathRewrite }: ProxyOptions) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    proxyTimeout: config.requestTimeoutMs,
    timeout: config.requestTimeoutMs,
    pathRewrite,

    // v3: events đặt trong "on"
    on: {
      proxyReq(proxyReq, req /* IncomingMessage */, _res) {
        // Ép kiểu nhẹ để lấy user/reqId do mình gắn ở Express layer
        const r = req as any;
        const user = r.user as { sub?: string; role?: string } | undefined;
        const reqId = r.reqId as string | undefined;
        const ip =
          (r.ip as string | undefined) ||
          (r.headers?.["x-forwarded-for"] as string | undefined) ||
          "";

        if (user?.sub) proxyReq.setHeader("x-user-id", String(user.sub));
        if (user?.role) proxyReq.setHeader("x-user-role", String(user.role));
        if (reqId) proxyReq.setHeader("x-request-id", String(reqId));
        proxyReq.setHeader("x-forwarded-for", ip);
        // Authorization header được forward mặc định
      },

      error(_err, _req, res /* ServerResponse | Socket */) {
        // Khi upstream down, trả 502 JSON; tương thích cả trường hợp res là Socket
        const r: any = res as any;
        try {
          if (!r.headersSent && typeof r.writeHead === "function") {
            r.writeHead(502, { "Content-Type": "application/json" });
          }
          if (typeof r.end === "function") {
            r.end(
              JSON.stringify({
                error: { code: "BAD_GATEWAY", message: "Upstream unavailable" },
              })
            );
          }
        } catch {
          // nuốt lỗi thứ cấp
        }
      },
    },

    selfHandleResponse: false,
  });
}
