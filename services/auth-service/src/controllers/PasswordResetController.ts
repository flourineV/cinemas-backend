// src/controllers/PasswordResetController.ts
import { Request, Response, NextFunction } from "express";
import { PasswordResetService } from "../services/PasswordResetService";
import { ForgotPasswordRequest } from "../dtos/request/ForgotPasswordRequest";
import { ResetPasswordRequest } from "../dtos/request/ResetPasswordRequest";

export class PasswordResetController {
  private passwordResetService: PasswordResetService;

  constructor(passwordResetService: PasswordResetService) {
    this.passwordResetService = passwordResetService;
  }

  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const body: ForgotPasswordRequest = req.body;
      if (!body?.email) {
        return res.status(400).json({ message: "email is required" });
      }
      await this.passwordResetService.sendOtp(body.email);
      res.json({ message: "OTP has been sent to your email!" });
    } catch (err) {
      next(err);
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const body: ForgotPasswordRequest = req.body;
      if (!body?.email) {
        return res.status(400).json({ message: "email is required" });
      }
      await this.passwordResetService.resendOtp(body.email);
      res.json({ message: "A new OTP has been sent to your email!" });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const body: ResetPasswordRequest = req.body;
      await this.passwordResetService.resetPassword(body);
      res.json({ message: "Password reset successfully!" });
    } catch (err) {
      next(err);
    }
  }
}
