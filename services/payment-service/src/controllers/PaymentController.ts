import { Router } from 'express';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { createHmac } from 'crypto';
import { ZaloPayService } from '../services/ZaloPayService.js';
import { PaymentService } from '../services/PaymentService.js';
import type { ZaloPayCreateOrderResponse } from '../dto/zalodto/ZaloPayCreateOrderResponse.js';
import type { ZaloCallbackDTO } from '../dto/zalodto/ZaloPayCallbackDTO.js';
import type { PaymentCriteria } from '../dto/request/PaymentCriteria.js';
import type { PagedResponse } from '../dto/response/PagedResponse.js';
import type { PaymentTransactionResponse } from '../dto/response/PaymentTransactionResponse.js';

import { ZaloPayConfig } from '../config/ZaloPayConfig.js';
import { requireAuthenticated, requireAdmin } from '../middleware/authChecker.js';
import { PaymentStatus } from '../models/PaymentStatus.js';
import { AppDataSource } from '../data-source.js';
import { paymentProducer, userProfileClient, showtimeServiceClient } from '../shared/instances.js';
import type { RequestWithUserContext } from 'types/userContext.js';
// Initialize services
const zaloPayConfig = new ZaloPayConfig();

const zaloPayService = new ZaloPayService(
  AppDataSource,
  zaloPayConfig,
  showtimeServiceClient
);
const paymentService = new PaymentService(AppDataSource, paymentProducer, userProfileClient);

const router = Router();

/**
 * HMAC-SHA256 encoding utility
 */
const hmacSHA256 = (key: string, data: string): string => {
  return crypto
    .createHmac('sha256', key)
    .update(data)
    .digest('hex');
};

/**
 * Safe parsing for ZaloPay return codes (can be Integer, Long, or String)
 */
const parseReturnCode = (value: any): number => {
  if (value === null || value === undefined) return -999;
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    try {
      return parseInt(value, 10);
    } catch (e) {
      return -999;
    }
  }
  return -999;
};

/**
 * POST /api/payments/create-zalopay-url/:id
 * Create ZaloPay payment URL for booking
 */
router.post('/create-zalopay-url', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.query;

    if (!bookingId) {
      res.status(400).json({ error: 'bookingId is required' });
      return;
    }
    
    const response: ZaloPayCreateOrderResponse = await zaloPayService.createOrder(
      bookingId as string
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error creating ZaloPay order', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(400).json({ error: `Error: ${errorMessage}` });
  }
});

/**
 * POST /api/payments/create-zalopay-url-fnb
 * Create ZaloPay payment URL for F&B order
 */
router.post('/create-zalopay-url-fnb', async (req: Request, res: Response) => {
  try {
    const { fnbOrderId } = req.query;

    if (!fnbOrderId) {
      res.status(400).json({ error: 'fnbOrderId is required' });
      return;
    }

    const response: ZaloPayCreateOrderResponse = await zaloPayService.createOrderForFnb(
      fnbOrderId as string
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error creating ZaloPay order for FnB', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: `Error: ${errorMessage}` });
  }
});

/**
 * POST /api/payments/callback
 * ZaloPay callback endpoint
 */
router.post('/callback', async (req: Request, res: Response) => {
  const result: Record<string, any> = {};

  try {
    const callbackDTO: ZaloCallbackDTO = req.body;
    const dataStr = callbackDTO.data;
    const reqMac = callbackDTO.mac;

    // Verify MAC
    const mac = hmacSHA256(zaloPayConfig.key2, dataStr);

    if (reqMac !== mac) {
      result.return_code = -1;
      result.return_message = 'mac not equal';
    } else {
      const dataNode = JSON.parse(dataStr);

      const appTransId: string = dataNode.app_trans_id;
      const amount: number = dataNode.amount;

      console.info(`ZaloPay Callback received for transId: ${appTransId}`);

      // Call business logic
      await paymentService.confirmPaymentSuccess(appTransId, 'ZaloPay', amount);

      result.return_code = 1;
      result.return_message = 'success';
    }
  } catch (error) {
    console.error('Callback processing error', error);
    result.return_code = 0;
    result.return_message = error instanceof Error ? error.message : 'Unknown error';
  }

  res.status(200).json(result);
});

/**
 * GET /api/payments/check-status
 * Check transaction status with ZaloPay
 */
router.get('/check-status', async (req: Request, res: Response) => {
  try {
    const { appTransId } = req.query;

    if (!appTransId || typeof appTransId !== 'string') {
      res.status(400).json({ error: 'appTransId is required' });
      return;
    }

    // 1. Call ZaloPay to check actual status
    const zpStatus = await zaloPayService.checkOrderStatus(appTransId);

    // Safe parsing - ZaloPay can return Integer or Long
    const returnCode = parseReturnCode(zpStatus.return_code);
    const subReturnCode = parseReturnCode(zpStatus.sub_return_code);
    const isSuccess = returnCode === 1;

    console.info(
      `🔍 ZaloPay status check - appTransId: ${appTransId}, returnCode: ${returnCode}, subReturnCode: ${subReturnCode}`
    );

    // Get transaction info first
    const transaction = await paymentService.getTransactionByRef(appTransId);

    if (isSuccess) {
      const amount = parseInt(zpStatus.amount.toString(), 10);
      // Call confirm (it has duplicate check so safe to call again)
      await paymentService.confirmPaymentSuccess(appTransId, 'ZaloPay', amount);
    } else {
      // When payment failed or user cancelled, update status and unlock seats
      // returnCode = 2: Transaction failed
      // returnCode = 3: Transaction not paid (pending/cancelled)
      // subReturnCode = -49: User cancelled
      // Also handle negative returnCode (errors from ZaloPay)
      const shouldCancel =
        returnCode === 2 || returnCode === 3 || subReturnCode === -49 || returnCode < 0;

      if (shouldCancel) {
        const reason = zpStatus.return_message
          ? zpStatus.return_message.toString()
          : subReturnCode === -49
          ? 'User cancelled'
          : 'Payment failed';
        await paymentService.handlePaymentCancelled(appTransId, reason);
      }
    }

    const response: Record<string, any> = {
      isSuccess,
      returnCode,
      returnMessage: zpStatus.return_message,
    };

    // Add bookingId to response so FE can cancel booking when payment fails
    if (transaction && transaction.bookingId) {
      response.bookingId = transaction.bookingId;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error checking transaction status', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: `Error checking status: ${errorMessage}` });
  }
});

/**
 * GET /api/payments/admin/search
 * Search payments with criteria (Admin only)
 */
router.get('/admin/search', requireAdmin, async (req: RequestWithUserContext, res: Response) => {
  try {
    const {
      keyword,
      userId,
      bookingId,
      showtimeId,
      transactionRef,
      status,
      method,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      page = '0',
      size = '10',
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = req.query;

    const criteria: PaymentCriteria = {
        keyword: keyword as string,
        userId: userId as string,
        bookingId: bookingId as string,
        showtimeId: showtimeId as string,
        transactionRef: transactionRef as string,
        status: status as PaymentStatus,
        method: method as string,
        minAmount: minAmount as string,
        maxAmount: maxAmount as string,
        ...(fromDate && { fromDate: new Date(fromDate as string) }),
        ...(toDate && { toDate: new Date(toDate as string) }),
    };

    const response: PagedResponse<PaymentTransactionResponse> =
      await paymentService.getPaymentsByCriteria(
        criteria,
        parseInt(page as string, 10),
        parseInt(size as string, 10),
        sortBy as string,
        sortDir as string
      );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error searching payments', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/payments/user/:userId
 * Get payments by user ID
 */
router.get('/user/:userId', requireAuthenticated, async (req: RequestWithUserContext, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ message: "user ID is required" });
    }
    // Verify user can only access their own payments
    const currentUserId = (req as any).userId; // Set by requireAuthenticated middleware
    if (currentUserId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const payments: PaymentTransactionResponse[] =
      await paymentService.getPaymentsByUserId(userId);

    res.status(200).json(payments);
  } catch (error) {
    console.error('Error getting payments by user', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/payments/:id
 * Get payment by ID
 */
router.get('/:id', requireAuthenticated, async (req: RequestWithUserContext, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: "payment ID is required" });
    }
    const payment: PaymentTransactionResponse = await paymentService.getPaymentById(id);

    // Verify user can only access their own payment
    const currentUserId = (req as any).userId; // Set by requireAuthenticated middleware
    if (currentUserId !== payment.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Error getting payment by ID', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;