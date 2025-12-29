import { DataSource } from 'typeorm';
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import * as qs from 'qs';
import {PaymentStatus} from '../models/PaymentStatus.js';
import {PaymentTransaction} from '../models/PaymentTransaction.js'
import type {ZaloPayCreateOrderResponse} from '../dto/zalodto/ZaloPayCreateOrderResponse.js';
import { ZaloPayConfig } from '../config/ZaloPayConfig.js';
import { ShowtimeServiceClient } from '../client/ShowtimeServiceClient.js'

export class ZaloPayService {
    private readonly axiosInstance: AxiosInstance;

    constructor(
        private readonly dataSource: DataSource,
        private readonly zaloPayConfig: ZaloPayConfig,
        private readonly showtimeServiceClient: ShowtimeServiceClient
    ) {
        this.axiosInstance = axios.create({
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        });
    }

        // HMAC-SHA256 encoding utility
    private hmacSHA256(key: string, data: string): string {
        return crypto
        .createHmac('sha256', key)
        .update(data)
        .digest('hex');
    }

    /**
     * Format date as yyMMdd
     */
    private formatDate(date: Date): string {
        const yy = date.getFullYear().toString().slice(-2);
        const MM = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yy}${MM}${dd}`;
    }

    /**
     * Generate short UUID (8 characters)
     */
    private generateShortId(): string {
        return crypto.randomUUID().substring(0, 8);
    }

    /*
     * Sleep utility for retry logic
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async createOrder(bookingId: string): Promise<ZaloPayCreateOrderResponse> {
        console.info(`💳 Starting ZaloPay order creation for bookingId: ${bookingId}`);

        return this.dataSource.transaction(async (manager) => {
        const paymentRepository = manager.getRepository(PaymentTransaction);

        // 1. Check authentication (comment out for quick testing if needed)
        //requireAuthenticated();

        // 2. Get pending transaction
        const transactions = await paymentRepository.find({
            where: {
            bookingId,
            status: PaymentStatus.PENDING,
            },
        });

        const transaction = transactions[0];
        if (!transaction) {
            throw new Error(`No PENDING transaction found for booking ${bookingId}`);
        }

        // 2.5. Validate amount - ZaloPay requires amount > 0
        const amount = parseInt(transaction.amount);
        if (!transaction.amount || amount <= 0) {
            console.error(
            `❌ Cannot create ZaloPay order with zero or negative amount for bookingId: ${bookingId}`
            );
            throw new Error(
            `Payment amount must be greater than 0. Current amount: ${transaction.amount || 'null'}`
            );
        }

        // 3. Extend seat lock to 10 minutes before creating payment order
        try {
            if (!transaction.showtimeId) {
                throw new Error('showtimeId is required to extend seat lock');
            }
            await this.showtimeServiceClient.extendSeatLockForPayment(
                transaction.showtimeId,
                transaction.seats ?? [],
                transaction.userId,
                //undefined // guestSessionId - not yet supporting guest payment
            );
            console.info(`✅ Extended seat lock for payment - bookingId: ${bookingId}`);
        } catch (error) {
            console.error(`❌ Failed to extend seat lock for bookingId: ${bookingId}`, error);
            throw new Error('Seats are no longer available. Please select seats again.');
        }

        // 4. Create app_trans_id (IMPORTANT: Must be < 40 characters)
        const today = this.formatDate(new Date());
        const shortId = this.generateShortId();
        const appTransId = `${today}_${shortId}`;

        // Update DB
        transaction.transactionRef = appTransId;
        transaction.method = 'ZALOPAY';
        await paymentRepository.save(transaction);

        // 5. Prepare payment data
        const appTime = Date.now();
        const appUser = 'CineHub_User';

        // embed_data: contains redirecturl
        const embedDataMap = {
            redirecturl: this.zaloPayConfig.redirectUrl,
        };
        const embedData = JSON.stringify(embedDataMap);

        const item = '[]';
        const description = `CineHub - Thanh toan don hang #${shortId}`;
        const bankCode = '';

        // 6. Create MAC signature (HMAC-SHA256)
        // Format: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
        const dataToHash = `${this.zaloPayConfig.appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${item}`;

        const mac = this.hmacSHA256(this.zaloPayConfig.key1, dataToHash);

        // 7. Prepare form data
        const requestBody = {
            app_id: this.zaloPayConfig.appId,
            app_user: appUser,
            app_time: appTime.toString(),
            amount: amount.toString(),
            app_trans_id: appTransId,
            embed_data: embedData,
            item: item,
            bank_code: bankCode,
            description: description,
            callback_url: this.zaloPayConfig.callbackUrl,
            mac: mac,
            expire_duration_seconds: '600',
        };

        const createEndpoint = `${this.zaloPayConfig.endpoint}/create`;

        console.info('🚀 Sending Form Request to ZaloPay:');
        console.info(`   app_id: ${this.zaloPayConfig.appId}`);
        console.info(`   app_trans_id: ${appTransId}`);
        console.info(`   amount: ${amount}`);
        console.info(`   app_time: ${appTime}`);
        console.info(`   description: ${description}`);
        console.info(`   embed_data: ${embedData}`);
        console.info(`   callback_url: ${this.zaloPayConfig.callbackUrl}`);
        console.info(`   mac: ${mac}`);
        console.info(`   Full request body: ${JSON.stringify(requestBody)}`);

        try {
            // Send as form-urlencoded
            const response = await this.axiosInstance.post<any>(
            createEndpoint,
            qs.stringify(requestBody)
            );

            const responseData = response.data;

            if (!responseData) {
            throw new Error('No response from ZaloPay');
            }

            const returnCode = responseData.return_code;

            if (returnCode !== 1) {
            const subMsg = responseData.sub_return_message;
            const subCode = responseData.sub_return_code;
            console.error(`❌ ZaloPay Error: ${subCode} - ${subMsg}`);
            throw new Error(`ZaloPay failed: ${subMsg}`);
            }

            const orderUrl = responseData.order_url;
            const zpTransToken = responseData.zp_trans_token;
            const qrCode = responseData.qr_code;
            const orderToken = responseData.order_token;
            console.info(`✅ ZaloPay Order Created: ${orderUrl}`);

            // Map to DTO Response
            const result: ZaloPayCreateOrderResponse = {
            return_code: returnCode,
            return_message: "Success",
            order_url: orderUrl,
            sub_return_code: 1,
            sub_return_message: 'Success',
            zp_trans_token: zpTransToken,
            order_token: orderToken,
            qr_code: qrCode,
            };

            return result;
        } catch (error) {
            console.error('🔥 Exception calling ZaloPay:', error);
            const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to initiate payment with ZaloPay: ${errorMessage}`);
        }
        });
    }

    async checkOrderStatus(appTransId: string): Promise<Record<string, any>> {
        const appId = this.zaloPayConfig.appId;
        const key1 = this.zaloPayConfig.key1;

        // 1. Create MAC for Query Request
        // Format: appId|appTransId|key1
        const data = `${appId}|${appTransId}|${key1}`;
        const mac = this.hmacSHA256(key1, data);

        // 2. Prepare form params
        const params = {
        app_id: appId,
        app_trans_id: appTransId,
        mac: mac,
        };

        const queryEndpoint = `${this.zaloPayConfig.endpoint}/query`;

        console.info(`🔍 Checking status for transId: ${appTransId}`);

        try {
        const response = await this.axiosInstance.post<Record<string, any>>(
            queryEndpoint,
            qs.stringify(params)
        );

        const responseData = response.data;

        if (responseData) {
            console.info(`ZaloPay Query Response: ${JSON.stringify(responseData)}`);
            return responseData;
        } else {
            throw new Error('Empty response from ZaloPay query');
        }
        } catch (error) {
        console.error('Error querying ZaloPay status', error);
        throw new Error('Failed to query transaction status');
        }
    }

    async createOrderForFnb(fnbOrderId: string): Promise<ZaloPayCreateOrderResponse> {
        console.info(`💳 Starting ZaloPay order creation for fnbOrderId: ${fnbOrderId}`);

        return this.dataSource.transaction(async (manager) => {
        const paymentRepository = manager.getRepository(PaymentTransaction);

        // 1. Check authentication
        //requireAuthenticated();

        // 2. Get pending FnB payment transaction with retry (wait for RabbitMQ event processing)
        let transaction: PaymentTransaction | null = null;
        const maxRetries = 5;
        const retryDelay = 200; // ms

        for (let i = 0; i < maxRetries; i++) {
            const transactions = await paymentRepository.find({
            where: {
                fnbOrderId,
                status: PaymentStatus.PENDING,
            },
            });

            if (transactions.length > 0) {
            transaction = transactions[0] ?? null;
            break;
            }

            if (i < maxRetries - 1) {
            console.info(
                `⏳ Waiting for FnB transaction to be created (retry ${i + 1}/${maxRetries})`
            );
            await this.sleep(retryDelay);
            }
        }

        if (!transaction) {
            throw new Error(
            `No PENDING transaction found for FnB order ${fnbOrderId} after ${maxRetries} retries`
            );
        }

        // 3. Create app_trans_id (must be < 40 chars)
        const today = this.formatDate(new Date());
        const shortId = this.generateShortId();
        const appTransId = `${today}_FNB_${shortId}`;

        // Update DB
        transaction.transactionRef = appTransId;
        transaction.method = 'ZALOPAY';
        await paymentRepository.save(transaction);

        // 4. Prepare payment data
        const appTime = Date.now();
        const amount = parseInt(transaction.amount);
        const appUser = 'CineHub_User';

        // embed_data: contains redirecturl
        const embedDataMap = {
            redirecturl: this.zaloPayConfig.redirectUrl,
        };
        const embedData = JSON.stringify(embedDataMap);

        const item = '[]';
        const description = `CineHub - Thanh toan bap nuoc #${shortId}`;
        const bankCode = '';

        // 5. Create MAC signature (HMAC-SHA256)
        const dataToHash = `${this.zaloPayConfig.appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${item}`;

        const mac = this.hmacSHA256(this.zaloPayConfig.key1, dataToHash);

        // 6. Prepare form data
        const requestBody = {
            app_id: this.zaloPayConfig.appId,
            app_user: appUser,
            app_time: appTime.toString(),
            amount: amount.toString(),
            app_trans_id: appTransId,
            embed_data: embedData,
            item: item,
            bank_code: bankCode,
            description: description,
            callback_url: this.zaloPayConfig.callbackUrl,
            mac: mac,
            expire_duration_seconds: '600',
        };

        const createEndpoint = `${this.zaloPayConfig.endpoint}/create`;

        console.info(`🚀 Sending FnB Payment Request to ZaloPay: ${JSON.stringify(requestBody)}`);

        try {
            const response = await this.axiosInstance.post<any>(
            createEndpoint,
            qs.stringify(requestBody)
            );

            const responseData = response.data;

            if (!responseData) {
            throw new Error('No response from ZaloPay');
            }

            const returnCode = responseData.return_code;

            if (returnCode !== 1) {
            const subMsg = responseData.sub_return_message;
            const subCode = responseData.sub_return_code;
            console.error(`❌ ZaloPay Error: ${subCode} - ${subMsg}`);
            throw new Error(`ZaloPay failed: ${subMsg}`);
            }

            const orderUrl = responseData.order_url;
            const zpTransToken = responseData.zp_trans_token;
            const orderToken = responseData.order_token;
            const qrCode = responseData.qr_code;
            console.info(`✅ ZaloPay FnB Order Created: ${orderUrl}`);

            const result: ZaloPayCreateOrderResponse = {
            return_code:returnCode,
            order_url:orderUrl,
            sub_return_message: 'Success',
            return_message: "Success",
            sub_return_code: 1,
            zp_trans_token: zpTransToken,
            order_token: orderToken,
            qr_code: qrCode,
            };

            return result;
        } catch (error) {
            console.error('🔥 Exception calling ZaloPay for FnB:', error);
            const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to initiate FnB payment with ZaloPay: ${errorMessage}`);
        }
        });
    }
}