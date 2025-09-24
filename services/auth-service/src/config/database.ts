import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../models/User.entity";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Khởi tạo kết nối database
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
  synchronize: process.env.NODE_ENV === "development", // Chỉ bật synchronize trong môi trường development
  logging: process.env.NODE_ENV === "development",
  entities: [User],
  subscribers: [],
  migrations: [],
});
