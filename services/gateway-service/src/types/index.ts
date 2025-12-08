import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export interface RouteConfig {
  id: string;
  path: string;
  target: string;
  excludePaths?: string[];
  requireAuth?: boolean;
  changeOrigin?: boolean;
  timeout?: number;
}

export interface JwtPayload {
  sub: string; // userId
  role: string;
  iat?: number;
  exp?: number;
}

export interface ServiceConfig {
  baseUrl: string;
  timeout?: number;
}

export interface GatewayConfig {
  routes: RouteConfig[];
}

export interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
  path?: string;
}
