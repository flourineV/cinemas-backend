import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

export class AuthController {
  static async login(req: Request, res: Response) {
    const token = await AuthService.login(req.body);
    res.json(token);
  }

  static async register(req: Request, res: Response) {
    const user = await AuthService.register(req.body);
    res.json(user);
  }
}