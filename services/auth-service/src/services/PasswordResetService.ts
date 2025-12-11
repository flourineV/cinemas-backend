// src/services/PasswordResetService.ts
import { UserRepository } from "../repositories/UserRepository";
import { PasswordResetOtpRepository } from "../repositories/PasswordResetOtpRepository";
import { EmailService } from "../services/EmailService";
import { ResetPasswordRequest } from "../dtos/request/ResetPasswordRequest";
import { PasswordResetOtp } from "../models/PasswordResetOtp.entity";
import bcrypt from "bcrypt";

export class PasswordResetService {
  private otpRepository: PasswordResetOtpRepository;
  private userRepository: UserRepository;
  private emailService: EmailService;
  private otpExpirationMinutes: number;

  constructor(
    otpRepository: PasswordResetOtpRepository,
    userRepository: UserRepository,
    emailService: EmailService
  ) {
    this.otpRepository = otpRepository;
    this.userRepository = userRepository;
    this.emailService = emailService;
    this.otpExpirationMinutes = Number(process.env.OTP_EXPIRATION_MINUTES);
  }

  // gửi mã otp
  async sendOtp(email: string): Promise<void> {
    const exists = await this.userRepository.existsByEmail(email);
    if (!exists) {
      throw new Error("Email not registered");
    }

    await this.otpRepository.deleteAllByEmail(email);

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const otpEntity = new PasswordResetOtp();
    otpEntity.email = email;
    otpEntity.otp = otp;
    otpEntity.expiresAt = new Date(
      Date.now() + this.otpExpirationMinutes * 60 * 1000
    );

    await this.otpRepository.save(otpEntity);

    await this.emailService.sendEmail(
      email,
      "CineMas - Xác thực đặt lại mật khẩu",
      `Mã OTP của bạn là: ${otp}\n\nMã này sẽ hết hạn sau ${this.otpExpirationMinutes} phút.`
    );
  }

  // gửi lại otp
  async resendOtp(email: string): Promise<void> {
    const existingOtp = await this.otpRepository.findLatestValidOtp(
      email,
      new Date()
    );
    if (existingOtp) {
      throw new Error("OTP vẫn còn hiệu lực, hãy thử lại sau.");
    }
    await this.sendOtp(email);
  }

  // reset password
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    const otpEntity = await this.otpRepository.findByEmailAndOtp(
      request.email,
      request.otp
    );
    if (!otpEntity) {
      throw new Error("Invalid OTP");
    }

    if (otpEntity.expiresAt.getTime() < Date.now()) {
      throw new Error("OTP has expired");
    }

    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new Error("User not found");
    }

    user.passwordHash = await bcrypt.hash(request.newPassword, 10);
    await this.userRepository.save(user);

    await this.otpRepository.deleteAllByEmail(request.email);
  }

  // xóa otp hết hạn
  async deleteExpiredOtps(): Promise<void> {
    await this.otpRepository.deleteExpiredOtps(new Date());
  }
}
