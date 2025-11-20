// src/controllers/UserController.ts
import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/UserService";
import { AuthChecker } from "../middlewares/AuthChecker";

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      AuthChecker.requireAdmin(req);

      const {
        keyword,
        status,
        role,
        page = 1,
        size = 10,
        sortBy,
        sortType,
      } = req.query;

      const users = await this.userService.getUsers(
        keyword as string | null,
        status as string | null,
        role as string | null,
        Number(page),
        Number(size),
        sortBy as string | null,
        sortType as string | null
      );

      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      AuthChecker.requireAdmin(req);
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      AuthChecker.requireAdmin(req);
      const { id } = req.params;
      const { newStatus } = req.query;
      await this.userService.updateUserStatus(id, newStatus as string);
      res.json({ message: "User status updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      AuthChecker.requireAdmin(req);
      const { id } = req.params;
      const { newRole } = req.query;
      await this.userService.updateUserRole(id, newRole as string);
      res.json({ message: "User role updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      AuthChecker.requireAdmin(req);
      const { id } = req.params;
      await this.userService.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}
