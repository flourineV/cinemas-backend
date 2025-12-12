import { IsEmail, IsNotEmpty } from "class-validator";

export class ResetPasswordRequest {
  @IsEmail({}, { message: "Valid email is required" })
  email: string;

  @IsNotEmpty({ message: "OTP is required" })
  otp: string;

  @IsNotEmpty({ message: "New password is required" })
  newPassword: string;
}
