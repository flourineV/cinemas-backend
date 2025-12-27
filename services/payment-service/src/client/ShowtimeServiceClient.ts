import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ExtendSeatLockRequest } from '../dto/external/ExtendSeatLockRequest.js';

export class ShowtimeServiceClient {
    private readonly axiosInstance: AxiosInstance;
    private readonly showtimeServiceUrl: string;
    private readonly internalSecretKey: string;

    constructor(showtime_service_url: string, interal_secret_key: string) {
        this.showtimeServiceUrl = showtime_service_url
        this.internalSecretKey = interal_secret_key;

        this.axiosInstance = axios.create({
        baseURL: this.showtimeServiceUrl,
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json'
        }
        });
    }

    //Extend seat lock TTL to 10 minutes when payment is initiated
    async extendSeatLockForPayment(
        showtimeId: string,
        seatIds: string[],
        userId?: string,
        guestSessionId?: string
    ): Promise<void> {
        try {
        const url = '/seat-lock/extend-for-payment';

        const requestBody: ExtendSeatLockRequest = {
            showtimeId,
            seatIds
        };

        if (userId) {
            requestBody.userId = userId;
        }

        if (guestSessionId) {
            requestBody.guestSessionId = guestSessionId;
        }

        await this.axiosInstance.post(url, requestBody, {
            headers: {
            'x-internal-secret': this.internalSecretKey
            }
        });

        console.log(`[ShowtimeServiceClient] Extended seat lock for showtime ${showtimeId} - ${seatIds.length} seats`);
        } catch (error) {
        console.error(`[ShowtimeServiceClient] Failed to extend seat lock for showtime ${showtimeId}`, error);
            throw new Error('Cannot extend seat lock. Please try again.');
        }
    }
}

export default ShowtimeServiceClient;