import { IsEmail, IsNotEmpty, Length, MaxLength } from "class-validator";

export class SignUpRequest {
  @IsNotEmpty({ message: "Username is required" })
  @Length(3, 30, { message: "Username must be between 3 and 30 characters" })
  username!: string;

  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Email should be valid" })
  @MaxLength(100, { message: "Email must be less than 100 characters" })
  email!: string;

  @IsNotEmpty({ message: "Phone number is required" })
  @MaxLength(15, { message: "Phone number must be less than 15 characters" })
  phoneNumber!: string;

  @IsNotEmpty({ message: "National ID is required" })
  @MaxLength(20, { message: "National ID must be less than 20 characters" })
  nationalId!: string;

  @IsNotEmpty({ message: "Password is required" })
  @Length(8, 50, { message: "Password must be between 8 and 50 characters" })
  password!: string;

  @IsNotEmpty({ message: "Password confirmation is required" })
  confirmPassword!: string;
}
