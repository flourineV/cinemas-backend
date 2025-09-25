import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import { access } from "fs";

export class AuthController {
  private static authService = new AuthService();

  // Sign up new user
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      // get data from request body
      const { email, username, password, phoneNumber, nationalId } = req.body;

      // Call service
      const result = await AuthController.authService.register({
        email,
        username,
        password,
        phoneNumber,
        nationalId,
      });

      // Return successful response (format giống login)
      return res.status(201).json({
        data: result,
      });
    } catch (error) {
      // Pass error to handler middleware
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      //Log in and get user info and tokens
      const result = await AuthController.authService.login({
        email,
        password,
      });

      return res.status(200).json({
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        user: result.user,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }

      const { accessToken, user } =
        await AuthController.authService.refresh(refreshToken);

      return res.status(200).json({
        data: {
          accessToken,
          tokenType: "Bearer",
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      return res.status(200).json({
        user: req.user, // payload added in auth middleware
      });
    } catch (error) {
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
}
