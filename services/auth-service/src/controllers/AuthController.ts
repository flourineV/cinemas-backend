import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import { SignUpRequest } from "../dtos/request/SignUpRequest";
import { SignInRequest } from "../dtos/request/SignInRequest";
import { JwtResponse } from "../dtos/response/JwtResponse";

export class AuthController {
  private authService: AuthService;
  private includeAccessTokenInBody: boolean;

  constructor(authService: AuthService) {
    this.authService = authService;
    this.includeAccessTokenInBody =
      process.env.INCLUDE_ACCESS_TOKEN_IN_BODY === "true";
  }

  async registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      const body: SignUpRequest = req.body;
      const jwtResponse = await this.authService.signUp(body);
      const responseBody: Partial<JwtResponse> = {
        accessToken: jwtResponse.accessToken,
        refreshToken: jwtResponse.refreshToken,
        tokenType: "Bearer",
        user: jwtResponse.user,
      };
      this.setRefreshTokenCookie(res, jwtResponse.refreshToken);
      this.setAccessTokenCookie(res, jwtResponse.accessToken);

      if (this.includeAccessTokenInBody) {
        responseBody.accessToken = jwtResponse.accessToken;
      }

      res.json(responseBody);
    } catch (err) {
      next(err);
    }
  }

  async authenticateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const body: SignInRequest = req.body;
      const jwtResponse = await this.authService.signIn(body);
      const responseBody: Partial<JwtResponse> = {
        accessToken: jwtResponse.accessToken,
        refreshToken: jwtResponse.refreshToken,
        tokenType: "Bearer",
        user: jwtResponse.user,
      };
      this.setRefreshTokenCookie(res, jwtResponse.refreshToken);
      this.setAccessTokenCookie(res, jwtResponse.accessToken);

      if (this.includeAccessTokenInBody) {
        responseBody.accessToken = jwtResponse.accessToken;
      }

      res.json(responseBody);
    } catch (err) {
      next(err);
    }
  }

  async logoutUser(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await this.authService.signOut(refreshToken);
      }

      this.clearRefreshTokenCookie(res);
      this.clearAccessTokenCookie(res);

      res.json({ message: "Log out successful!" });
    } catch (err) {
      next(err);
    }
  }

  private setAccessTokenCookie(res: Response, accessToken: string) {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 phút
    });
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: false,
      path: "/",
      maxAge: 0,
    });
  }

  private clearAccessTokenCookie(res: Response) {
    res.cookie("accessToken", "", {
      httpOnly: true,
      secure: false,
      path: "/",
      maxAge: 0,
    });
  }
}
