import { ShowtimeServiceClient } from '../client/ShowtimeServiceClient.js';
import {PaymentProducer} from '../producer/PaymentProducer.js';
import {UserProfileClient} from '../client/UserProfileClient.js';

const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY ?? '';
const RABBIT_URL = process.env.RABBIT_URL ?? 'amqp://localhost:5672';
const SHOWTIME_SERVICE_URL = process.env.SHOWTIME_SERVICE_URL ?? 'http://showtime-service:8084/api/showtimes';
const USER_PROFILE_SERVICE_URL = process.env.USER_PROFILE_SERVICE_URL || 'http://user-profile-service:8082';

export const paymentProducer = new PaymentProducer();
export const showtimeServiceClient = new ShowtimeServiceClient(SHOWTIME_SERVICE_URL, INTERNAL_SECRET_KEY);
export const userProfileClient = new UserProfileClient(USER_PROFILE_SERVICE_URL, INTERNAL_SECRET_KEY);


