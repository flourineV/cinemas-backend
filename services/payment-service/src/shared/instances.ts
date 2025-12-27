import { ShowtimeServiceClient } from '../client/ShowtimeServiceClient.js';
import {PaymentProducer} from '../producer/PaymentProducer.js';
import {UserProfileClient} from '../client/UserProfileClient.js';

export const showtimeServiceClient = new ShowtimeServiceClient();
export const paymentProducer = new PaymentProducer();
export const userProfileClient = new UserProfileClient();


