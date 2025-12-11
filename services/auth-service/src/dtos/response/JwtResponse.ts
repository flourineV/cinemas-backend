import { UserResponse } from "./UserResponse";

export class JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: UserResponse;

  constructor(
    accessToken: string,
    refreshToken: string,
    tokenType: string = "Bearer",
    user: UserResponse
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenType = tokenType;
    this.user = user;
  }
}
