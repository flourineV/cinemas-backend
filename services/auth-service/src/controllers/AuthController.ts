import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";

export class AuthController {
  private static authService = new AuthService();

  // Sign up new user
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      // get data request body
      const { email, username, password, phoneNumber, nationalId } = req.body;

      // Call service to process logic
      const user = await AuthController.authService.register({
        email,
        username,
        password,
        phoneNumber,
        nationalId,
      });

      // Return successful response
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          phoneNumber: user.phoneNumber,
          nationalId: user.nationalId,
          role: user.role,
          createdAt: user.createdAt,
        },
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
        success: true,
        message: "Login successful",
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        },
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

      const { user, tokens } =
        await AuthController.authService.refresh(refreshToken);

      return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
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
        success: true,
        user: req.user, // chính là payload từ access token
      });
    } catch (error) {
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
}
