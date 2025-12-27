import "reflect-metadata";
import { DataSource } from "typeorm";
import { UserProfile } from "../models/UserProfile.entity";
import dotenv from "dotenv";
import { UserRank } from "../models/UserRank.entity";
import { UserFavoriteMovie } from "../models/UserFavoriteMovie.entity";
import { ManagerProfile } from "../models/ManagerProfile.entity";
import { LoyaltyHistory } from "../models/LoyaltyHistory.entity";

// Load environment variables
dotenv.config();

// Connect to database
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
  synchronize: process.env.NODE_ENV === "development", // turn on synchronize only in development environment
  logging: process.env.NODE_ENV === "development",
  entities: [
    UserProfile,
    UserRank,
    UserFavoriteMovie,
    ManagerProfile,
    LoyaltyHistory,
  ],
  subscribers: [],
  migrations: [],
});
