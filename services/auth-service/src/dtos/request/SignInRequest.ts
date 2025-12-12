import { IsNotEmpty } from "class-validator";

export class SignInRequest {
  @IsNotEmpty({ message: "Username/Email/Phone is required" })
  usernameOrEmailOrPhone!: string;

  @IsNotEmpty({ message: "Password is required" })
  password!: string;
}
