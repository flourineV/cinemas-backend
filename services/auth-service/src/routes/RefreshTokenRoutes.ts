// src/routes/refreshTokenRoutes.ts
import { Router } from "express";
import { RefreshTokenController } from "../controllers/RefreshTokenController";
import { RefreshTokenService } from "../services/RefreshTokenService";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository";
import { JWT as JwtUtil } from "../config/JWT";
import { AppDataSource } from "../config/database";

const router = Router();

const refreshTokenRepository = new RefreshTokenRepository(AppDataSource);
const refreshTokenService = new RefreshTokenService(refreshTokenRepository);
const jwtUtil = new JwtUtil();

// tạo controller
const refreshTokenController = new RefreshTokenController(
  refreshTokenService,
  jwtUtil
);

// refresh token
router.post("/", (req, res, next) =>
  refreshTokenController.refreshToken(req, res, next)
);

export default router;
