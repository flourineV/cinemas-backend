import "reflect-metadata";
import { DataSource } from "typeorm";

import { Province } from "./models/Province.js";
import { Theater } from "./models/Theater.js";
import { Room } from "./models/Room.js";
import { Seat } from "./models/Seat.js";
import { Showtime } from "./models/Showtime.js";
import { ShowtimeSeat } from "./models/ShowtimeSeat.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL!,   // full Neon connection string
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
  synchronize: false, // dev mode only; use migrations in production
  logging: true,
  entities: [
    Province,
    Theater,
    Room,
    Seat,
    Showtime,
    ShowtimeSeat,
  ],
  migrations: [],
  subscribers: [],
});
