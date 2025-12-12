import { IsNotEmpty } from "class-validator";

export class TokenRefreshRequest {
  @IsNotEmpty({ message: "Refresh token is required" })
  refreshToken!: string;
}
