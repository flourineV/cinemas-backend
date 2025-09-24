import { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

type ExpiresIn = `${number}${"d" | "h" | "m" | "s"}` | number;

type JWTConfig = {
  accessToken: {
    secret: string;
    signOptions: {
      expiresIn: ExpiresIn;
      algorithm: "HS256";
    };
  };
  refreshToken: {
    secret: string;
    signOptions: {
      expiresIn: ExpiresIn;
      algorithm: "HS256";
    };
  };
};

const defaultConfig = {
  accessToken: {
    expiresIn: "15m" as ExpiresIn, // 15 minutes
    algorithm: "HS256" as const,
  },
  refreshToken: {
    expiresIn: "1h" as ExpiresIn, // 1 hour
    algorithm: "HS256" as const,
  },
};

// check required environment variables
if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET is not defined in environment variables");
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
}

export const jwtConfig: JWTConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    signOptions: {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES ||
        defaultConfig.accessToken.expiresIn) as ExpiresIn,
      algorithm: defaultConfig.accessToken.algorithm,
    },
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    signOptions: {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES ||
        defaultConfig.refreshToken.expiresIn) as ExpiresIn,
      algorithm: defaultConfig.refreshToken.algorithm,
    },
  },
};
