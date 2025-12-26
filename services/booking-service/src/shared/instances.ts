import Redis from 'ioredis';
import { SeatLockRedisService } from '../services/SeatLockRedisService.js';
import { BookingService } from '../services/BookingService.js';
import { FnbClient } from '../client/FnbClient.js';
import { MovieClient } from '../client/MovieClient.js';
import { PricingClient } from '../client/PricingClient.js';
import { PromotionClient } from '../client/PromotionClient.js';
import { ShowtimeClient } from '../client/ShowtimeClient.js';
import { UserProfileClient } from '../client/UserProfileClient.js';
import { BookingProducer } from '../producer/BookingProducer.js';
import { BookingStatsService } from '../services/BookingStatsService.js';
import { AppDataSource } from '../data-source.js';
/**
 * Clients (API or external services)
 */
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const USER_PROFILE_SERVICE_URL = process.env.USERP_PROFILE_SERVICE_URL || 'http://localhost:8082';
const MOVIE_SERVICE_URL = process.env.MOVIE_SERVICE_URL || 'http://localhost:8083';
const SHOWTIME_SERVICE_URL = process.env.SHOWTIME_SERVICE_URL || 'http://localhost:8084';
const PRICING_SERVICE_URL = process.env.PRICING_SERVICE_URL || 'http://localhost:8087';
const FNB_SERVICE_URL = process.env.FNB_SERVICE_URL || 'http://localhost:8088';
const PROMOTION_SERVICE_URL = process.env.PROMOTION_SERVICE_URL || 'http://localhost:8089';
const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY || 'internal_secret_key_booking_service_12345';

export const redisClient = new Redis(REDIS_URL);

export const fnbClient = new FnbClient(FNB_SERVICE_URL);
export const userProfileClient = new UserProfileClient(USER_PROFILE_SERVICE_URL, INTERNAL_SECRET_KEY);
export const movieClient = new MovieClient(MOVIE_SERVICE_URL, INTERNAL_SECRET_KEY);
export const showtimeClient = new ShowtimeClient(SHOWTIME_SERVICE_URL);
export const pricingClient = new PricingClient(PRICING_SERVICE_URL);
export const promotionClient = new PromotionClient(PROMOTION_SERVICE_URL);
export const seatLockRedisService = new SeatLockRedisService(redisClient);
export const bookingProducer = new BookingProducer();
export const bookingService = new BookingService(AppDataSource, pricingClient, promotionClient, fnbClient, showtimeClient, movieClient, userProfileClient, bookingProducer, seatLockRedisService);
export const bookingStatsService = new BookingStatsService(AppDataSource, showtimeClient);
