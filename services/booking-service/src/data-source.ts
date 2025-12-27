import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { Booking } from './models/Booking.js';
import { BookingFnb } from './models/BookingFnb.js';
import { BookingPromotion } from './models/BookingPromotion.js';
import { BookingSeat } from './models/BookingSeat.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DB_URL || '', // Neon connection string
  ssl: {
    rejectUnauthorized: false, // Neon requires SSL
  },
  synchronize: false, // true only in dev, false in prod
  logging: true,
  entities: [Booking, BookingFnb, BookingPromotion, BookingSeat],
  migrations: ['./src/migrations/*.ts'],
  subscribers: [],
});