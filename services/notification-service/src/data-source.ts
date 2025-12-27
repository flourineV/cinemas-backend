import "reflect-metadata";
import { DataSource } from "typeorm";

import { Notification } from "./models/Notification.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL!,   // full Neon connection string
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
  synchronize: false, 
  logging: true,
  entities: [Notification],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
});
