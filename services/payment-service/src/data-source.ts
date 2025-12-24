import "reflect-metadata";
import { DataSource } from "typeorm";

// import your entities


export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL!,   // full Neon connection string
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
  synchronize: false, // dev mode only; use migrations in production
  logging: true,
  entities: [
    
  ],
  migrations: [],
  subscribers: [],
});
