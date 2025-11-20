// src/controllers/RefreshTokenController.ts
import { Request, Response, NextFunction } from "express";
import { RefreshTokenService } from "../services/RefreshTokenService";
import { JWT as JwtUtil } from "../config/JWT";
import { TokenRefreshRequest } from "../dtos/request/TokenRefreshRequest";
import { JwtResponse } from "../dtos/response/JwtResponse";
import { UserResponse } from "../dtos/response/UserResponse";

export class RefreshTokenController {
  private refreshTokenService: RefreshTokenService;
  private jwtUtil: JwtUtil;

  constructor(refreshTokenService: RefreshTokenService, jwtUtil: JwtUtil) {
    this.refreshTokenService = refreshTokenService;
    this.jwtUtil = jwtUtil;
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const body: TokenRefreshRequest = req.body;
      const requestToken = body.refreshToken;

      const refreshToken =
        await this.refreshTokenService.findByToken(requestToken);
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token invalid" });
      }

      const verifiedToken =
        this.refreshTokenService.verifyExpiration(refreshToken);

      const roleName = (await verifiedToken).user.role
        ? (await verifiedToken).user.role.name
        : "guest";

      const newAccessToken = this.jwtUtil.generateAccessToken(
        (await verifiedToken).user.id,
        roleName
      );

      const newRefreshToken = await this.refreshTokenService.createRefreshToken(
        (await verifiedToken).user
      );

      await this.refreshTokenService.deleteByToken(requestToken);

      // Tạo response DTO
      const jwtResponse = new JwtResponse(
        newAccessToken,
        newRefreshToken.token,
        "Bearer",
        UserResponse.fromEntity((await verifiedToken).user)
      );

      res.json(jwtResponse);
    } catch (err) {
      next(err);
    }
  }
}
