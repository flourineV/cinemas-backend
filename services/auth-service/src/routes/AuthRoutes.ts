import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { AuthService } from "../services/AuthService";
import { UserRepository } from "../repositories/UserRepository";
import { RoleRepository } from "../repositories/RoleRepository";
import { RefreshTokenService } from "../services/RefreshTokenService";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository";
import { JWT } from "../config/JWT";
import { AppDataSource } from "../config/database";

const router = Router();

const userRepository = new UserRepository(AppDataSource);
const roleRepository = new RoleRepository(AppDataSource);
const refreshTokenRepository = new RefreshTokenRepository(AppDataSource);
const refreshTokenService = new RefreshTokenService(refreshTokenRepository);
const jwtUtil = new JWT();

// tạo service
const authService = new AuthService(
  userRepository,
  roleRepository,
  refreshTokenService,
  jwtUtil
);

// tạo controller
const authController = new AuthController(authService);

// đăng ký
router.post("/signup", (req, res, next) =>
  authController.registerUser(req, res, next)
);

// đăng nhập
router.post("/signin", (req, res, next) =>
  authController.authenticateUser(req, res, next)
);

// đăng xuất
router.post("/signout", (req, res, next) =>
  authController.logoutUser(req, res, next)
);

export default router;
