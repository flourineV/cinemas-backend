import { IsNotEmpty } from "class-validator";

export class SignOutRequest {
  @IsNotEmpty({ message: "Refresh token is required" })
  refreshToken!: string;
}
