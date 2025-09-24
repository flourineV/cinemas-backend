import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  VerifiedCallback,
} from "passport-jwt";
import { UserRole } from "../models/User.entity";
import { jwtConfig } from "./jwt.config";

// interface for JWT payload
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number; // issued at
  exp?: number; // expires
}

// interface for user returned after verification
export interface JwtUser {
  userId: string;
  email: string;
  role: UserRole;
}

// JWT Strategies
export const setupJwtStrategies = () => {
  // Access Token Strategy
  passport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: jwtConfig.accessToken.secret,
        ...jwtConfig.accessToken.signOptions,
      },
      async (payload: JwtPayload, done: VerifiedCallback) => {
        try {
          const user: JwtUser = {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
          };
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Refresh Token Strategy
  passport.use(
    "jwt-refresh",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("refreshToken"),
        ignoreExpiration: false,
        secretOrKey: jwtConfig.refreshToken.secret,
        ...jwtConfig.refreshToken.signOptions,
      },
      async (payload: JwtPayload, done: VerifiedCallback) => {
        try {
          const user: JwtUser = {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
          };
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
};
