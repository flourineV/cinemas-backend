import "reflect-metadata";
import { DataSource } from "typeorm";
import { Promotion } from "../models/Promotion.entity";
import { RefundVoucher } from "../models/RefundVoucher.entity";
import { UsedPromotion } from "../models/UsedPromotion.entity";
import dotenv from "dotenv";

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
  entities: [Promotion, RefundVoucher, UsedPromotion],
  subscribers: [],
  migrations: [],
});
