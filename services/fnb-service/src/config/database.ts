import { DataSource } from "typeorm";
import "reflect-metadata";
import dotenv from "dotenv";
import { FnbItem } from "../models/FnbItem.entity";
import { FnbOrder } from "../models/FnbOrder.entity";
import { FnbOrderItem } from "../models/FnbOrderItem.entity";

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
  entities: [FnbItem, FnbOrder, FnbOrderItem],
  subscribers: [],
  migrations: [],
});
