import {
  createProxyMiddleware,
  Options,
  RequestHandler,
} from "http-proxy-middleware";
import { RouteConfig } from "../types";
import { createJwtMiddleware } from "../middleware/jwt.middleware";
import { Router } from "express";
import { ClientRequest, IncomingMessage, ServerResponse } from "http";

export const createProxyRouter = (route: RouteConfig): Router => {
  const router = Router();

  // Proxy options
  const proxyOptions: Options = {
    target: route.target,
    changeOrigin: route.changeOrigin !== false,
    pathRewrite: (path: string) => {
      // Thêm lại prefix vì Express đã strip nó
      return route.path + path;
    },
    timeout: route.timeout || 30000,
    proxyTimeout: route.timeout || 30000,
    on: {
      proxyReq: (
        proxyReq: ClientRequest,
        req: IncomingMessage,
        _res: ServerResponse
      ) => {
        // Forward custom headers
        const customHeaders = ["x-user-id", "x-user-role", "x-authenticated"];
        customHeaders.forEach((header) => {
          const value = req.headers[header];
          if (value) {
            proxyReq.setHeader(header, value as string);
          }
        });

        console.log(
          `[PROXY] ${req.method} ${req.url} -> ${route.target}${route.path}${req.url}`
        );
      },
      proxyRes: (
        proxyRes: IncomingMessage,
        _req: IncomingMessage,
        _res: ServerResponse
      ) => {
        console.log(
          `[PROXY] Response from ${route.id}: ${proxyRes.statusCode}`
        );
      },
      error: (err: Error, req: IncomingMessage, res: ServerResponse | any) => {
        console.error(`[PROXY ERROR] ${route.id}:`, err.message);
        if (res && typeof res.writeHead === "function" && !res.headersSent) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              status: 503,
              message: `Service ${route.id} unavailable`,
              timestamp: new Date().toISOString(),
              path: req.url,
            })
          );
        }
      },
    },
  };

  // Apply JWT middleware if required
  if (route.requireAuth) {
    router.use(createJwtMiddleware(route.excludePaths));
  }

  // Apply proxy
  router.use(createProxyMiddleware(proxyOptions) as RequestHandler);

  return router;
};
