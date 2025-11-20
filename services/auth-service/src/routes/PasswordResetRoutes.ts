import { Router } from "express";
import { PasswordResetController } from "../controllers/PasswordResetController";
import { PasswordResetService } from "../services/PasswordResetService";
import { PasswordResetOtpRepository } from "../repositories/PasswordResetOtpRepository";
import { UserRepository } from "../repositories/UserRepository";
import { EmailService } from "../services/EmailService";
import { AppDataSource } from "../config/Database";

const router = Router();

const otpRepository = new PasswordResetOtpRepository(AppDataSource);
const userRepository = new UserRepository(AppDataSource);
const emailService = new EmailService();

// tạo service
const passwordResetService = new PasswordResetService(
  otpRepository,
  userRepository,
  emailService
);

// Tạo controller
const passwordResetController = new PasswordResetController(
  passwordResetService
);

// gửi otp
router.post("/send-otp", (req, res, next) =>
  passwordResetController.sendOtp(req, res, next)
);

// gửi lại otp
router.post("/resend-otp", (req, res, next) =>
  passwordResetController.resendOtp(req, res, next)
);

// reset password
router.post("/reset-password", (req, res, next) =>
  passwordResetController.resetPassword(req, res, next)
);

export default router;
