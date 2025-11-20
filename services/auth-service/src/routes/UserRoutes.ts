// src/routes/userRoutes.ts
import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { UserService } from "../services/UserService";
import { UserRepository } from "../repositories/UserRepository";
import { AppDataSource } from "../config/Database";
import { RoleRepository } from "../repositories/RoleRepository";

const router = Router();

const userRepository = new UserRepository(AppDataSource);
const roleRepository = new RoleRepository(AppDataSource);
const userService = new UserService(userRepository, roleRepository);
// tạo controller
const userController = new UserController(userService);

// lấy tất cả user
router.get("/", (req, res, next) => userController.getAllUsers(req, res, next));

// lấy user bằng id
router.get("/:id", (req, res, next) =>
  userController.getUserById(req, res, next)
);

// cập nhật status của user
router.patch("/:id/status", (req, res, next) =>
  userController.updateUserStatus(req, res, next)
);

// cập nhật role user
router.patch("/:id/role", (req, res, next) =>
  userController.updateUserRole(req, res, next)
);

// xóa user
router.delete("/:id", (req, res, next) =>
  userController.deleteUser(req, res, next)
);

export default router;
