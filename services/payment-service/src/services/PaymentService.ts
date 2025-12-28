import { DataSource } from 'typeorm';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { PaymentStatus } from '../models/PaymentStatus.js';
import { PaymentProducer } from '../producer/PaymentProducer.js';
import { UserProfileClient } from '../client/UserProfileClient.js';
import type { BookingCreatedEvent } from "../events/BookingCreatedEvent.js";
import type { BookingFinalizedEvent } from "../events/BookingFinalizedEvent.js";
import type { FnbOrderCreatedEvent } from "../events/FnbOrderCreatedEvent.js";
import type { SeatUnlockedEvent } from "../events/SeatUnlockedEvent.js";
import type { PaymentBookingSuccessEvent } from "../events/PaymentBookingSuccessEvent.js";
import type { PaymentFnbSuccessEvent } from "../events/PaymentFnbSuccessEvent.js";
import type { PaymentFnbFailedEvent } from "../events/PaymentFnbFailedEvent.js";
import type { PaymentBookingFailedEvent } from "../events/PaymentBookingFailedEvent.js";
import type { PaymentCriteria } from "../dto/request/PaymentCriteria.js";
import type { PagedResponse } from "../dto/response/PagedResponse.js";
import type { PaymentTransactionResponse } from "../dto/response/PaymentTransactionResponse.js";
import { v4 as uuidv4 } from 'uuid';

export class PaymentService {
  private paymentRepository = this.dataSource.getRepository(PaymentTransaction);
  private readonly paymentProducer: PaymentProducer;
  private readonly userProfileClient: UserProfileClient;

  constructor(
    private dataSource: DataSource,
    paymentProducer: PaymentProducer,
    userProfileClient: UserProfileClient
  ) {
    this.paymentProducer = paymentProducer;
    this.userProfileClient = userProfileClient;
  }

  /**
   * Create PENDING transaction when Booking is created
   */
  async createPendingTransaction(event: BookingCreatedEvent): Promise<void> {
    // Check if transaction already exists to avoid duplicates
    const exists = await this.paymentRepository.existsBy({ bookingId: event.bookingId });
    
    if (exists) {
      console.warn(`[PaymentService] Transaction already exists for bookingId: ${event.bookingId}. Skipping.`);
      return;
    }

    const pendingTxn = this.paymentRepository.create({
      bookingId: event.bookingId,
      userId: event.userId,
      showtimeId: event.showtimeId,
      seatIds: event.seatIds,
      amount: event.totalPrice,
      method: 'UNKNOWN', // Will be updated later when user selects payment method
      status: PaymentStatus.PENDING,
      transactionRef: `TXN_INIT_${uuidv4()}`
    });

    await this.paymentRepository.save(pendingTxn);
    console.log(`[PaymentService] PENDING Transaction created for bookingId: ${event.bookingId}`);
  }

  /**
   * Create PENDING transaction when FnbOrder is created
   */
  async createPendingTransactionForFnb(event: FnbOrderCreatedEvent): Promise<void> {
    // Check if transaction already exists to avoid duplicates
    const exists = await this.paymentRepository.existsBy({ fnbOrderId: event.fnbOrderId });
    
    if (exists) {
      console.warn(`[PaymentService] Transaction already exists for fnbOrderId: ${event.fnbOrderId}. Skipping.`);
      return;
    }

    const pendingTxn = this.paymentRepository.create({
      fnbOrderId: event.fnbOrderId,
      userId: event.userId,
      showtimeId: null, // FnB standalone has no showtime
      seatIds: [], // No seats
      amount: event.totalAmount,
      method: 'UNKNOWN',
      status: PaymentStatus.PENDING,
      transactionRef: `TXN_FNB_${uuidv4()}`
    });

    await this.paymentRepository.save(pendingTxn);
    console.log(
      `[PaymentService] PENDING Transaction created for fnbOrderId: ${event.fnbOrderId} | amount=${event.totalAmount}`
    );
  }

  /**
   * Confirm payment success (from ZaloPay callback)
   */
  async confirmPaymentSuccess(
    appTransId: string,
    merchantTransId: string,
    amountPaid: number
  ): Promise<void> {
    const txn = await this.paymentRepository.findOne({
      where: { transactionRef: appTransId }
    });

    if (!txn) {
      throw new Error(`Transaction not found for ref: ${appTransId}`);
    }

    if (txn.status === PaymentStatus.SUCCESS) {
      console.warn(`⚠️ [PaymentService] Transaction ${appTransId} already SUCCESS. Ignoring callback.`);
      return;
    }

    if (parseFloat(txn.amount) !== amountPaid) {
      console.error(
        `[PaymentService] Amount mismatch! Expected: ${txn.amount}, Paid: ${amountPaid}`
      );
      return;
    }

    // Update database
    txn.status = PaymentStatus.SUCCESS;
    txn.method = 'ZALOPAY'; // Or get from callback
    await this.paymentRepository.save(txn);

    console.log(
      `💰 [PaymentService] Payment SUCCESS for bookingId: ${txn.bookingId} | fnbOrderId: ${txn.fnbOrderId}`
    );

    // Send event to Booking Service (only if bookingId exists)
    if (txn.bookingId) {
      const bookingSuccessEvent: PaymentBookingSuccessEvent = {
        paymentId: txn.id,
        bookingId: txn.bookingId,
        showtimeId: txn.showtimeId!,
        userId: txn.userId,
        amount: txn.amount,
        method: 'ZALOPAY',
        seatIds: txn.seatIds ?? [],
        message: 'Payment confirmed via ZaloPay Callback'
      };
      await this.paymentProducer.sendPaymentBookingSuccessEvent(bookingSuccessEvent);
    }

    // If it's an FnB order, send event to FnB Service and add loyalty points
    if (txn.fnbOrderId) {
      // Calculate loyalty points for FnB: 10,000 VND = 1 point
      const pointsEarned = Math.floor(parseFloat(txn.amount) / 10000);

      if (pointsEarned > 0) {
        console.log(
          `💎 [PaymentService] Earning ${pointsEarned} loyalty points for FnB order ${txn.fnbOrderId} (amount: ${txn.amount})`
        );
        try {
          await this.userProfileClient.updateLoyaltyPoints(txn.userId, pointsEarned);
        } catch (error) {
          console.error(`[PaymentService] Failed to update loyalty points:`, error);
          // Don't fail the entire transaction if loyalty update fails
        }
      }

      const fnbSuccessEvent: PaymentFnbSuccessEvent = {
        paymentId: txn.id,
        fnbOrderId: txn.fnbOrderId,
        userId: txn.userId,
        amount: txn.amount,
        method: 'ZALOPAY',
        message: 'Payment confirmed via ZaloPay Callback'
      };
      await this.paymentProducer.sendPaymentFnbSuccessEvent(fnbSuccessEvent);
    }
  }

  /**
   * Update final amount after booking finalization
   */
  async updateFinalAmount(event: BookingFinalizedEvent): Promise<void> {
    console.log(
      `💰 [PaymentService] Updating Payment amount after finalization | bookingId=${event.bookingId} | newAmount=${event.finalPrice}`
    );

    // Find PENDING transaction for this booking
    const transactions = await this.paymentRepository.find({
      where: { bookingId: event.bookingId, status: PaymentStatus.PENDING }
    });

    if (transactions.length === 0) {
      console.warn(
        `[PaymentService] No PENDING transaction found for bookingId ${event.bookingId}. Skipping update.`
      );
      return;
    }

    const txn = transactions[0];
    if (!txn) {
      throw new Error('No transaction found');
    }
    txn.amount = event.finalPrice;
    await this.paymentRepository.save(txn);

    console.log(
      `[PaymentService] Updated transaction amount for bookingId ${event.bookingId} → ${event.finalPrice}`
    );
  }

  /**
   * Update status when seats are unlocked (expired)
   */
  async updateStatus(event: SeatUnlockedEvent): Promise<void> {
    console.log(
      `🕐 [PaymentService] Updating payment status due to seat unlock | bookingId=${event.bookingId} | reason=${event.reason}`
    );

    // Find PENDING transaction
    const transactions = await this.paymentRepository.find({
      where: { bookingId: event.bookingId, status: PaymentStatus.PENDING }
    });

    if (transactions.length === 0) {
      console.warn(
        `[PaymentService] No PENDING transaction found for bookingId ${event.bookingId}. Skipping status update.`
      );
      return;
    }

    const txn = transactions[0];
    if (!txn) {
      throw new Error('No transaction found');
    }
    // Update status to EXPIRED
    txn.status = PaymentStatus.EXPIRED;
    txn.transactionRef = `TXN_EXPIRED_${uuidv4()}`;
    await this.paymentRepository.save(txn);

    console.log(`💤 [PaymentService] Transaction marked as EXPIRED for bookingId ${event.bookingId}`);

    // Send event to booking-service or notification-service
    const expiredEvent: PaymentBookingFailedEvent = {
      paymentId: txn.id,
      bookingId: txn.bookingId!,
      showtimeId: txn.showtimeId!,
      userId: txn.userId,
      amount: txn.amount,
      method: txn.method,
      seatIds: txn.seatIds ?? [],
      reason: `Payment expired: ${event.reason}`
    };

    await this.paymentProducer.sendPaymentBookingFailedEvent(expiredEvent);
  }

  /**
   * Get all payments by user ID
   */
  async getPaymentsByUserId(userId: string): Promise<PaymentTransactionResponse[]> {
    const payments = await this.paymentRepository.find({ where: { userId } });
    return payments.map(this.toResponse);
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<PaymentTransactionResponse> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    
    if (!payment) {
      throw new Error(`Payment not found with id: ${id}`);
    }

    return this.toResponse(payment);
  }

  /**
   * Get transaction by reference
   */
  async getTransactionByRef(transactionRef: string): Promise<PaymentTransactionResponse | null> {
    const payment = await this.paymentRepository.findOne({ where: { transactionRef } });
    return payment ? this.toResponse(payment) : null;
  }

  /**
   * Handle payment cancellation
   */
  async handlePaymentCancelled(appTransId: string, reason: string): Promise<void> {
    console.log(
      `❌ [PaymentService] Handling payment cancellation for appTransId: ${appTransId} | reason: ${reason}`
    );

    const txn = await this.paymentRepository.findOne({
      where: { transactionRef: appTransId }
    });

    if (!txn) {
      console.warn(
        `[PaymentService] No transaction found for appTransId: ${appTransId}. Skipping cancellation.`
      );
      return;
    }

    // Only process if transaction is PENDING
    if (txn.status !== PaymentStatus.PENDING) {
      console.warn(
        `[PaymentService] Transaction ${appTransId} is not PENDING (current: ${txn.status}). Skipping cancellation.`
      );
      return;
    }

    // Update status to FAILED
    txn.status = PaymentStatus.FAILED;
    await this.paymentRepository.save(txn);

    console.log(`💔 [PaymentService] Transaction marked as FAILED for appTransId: ${appTransId}`);

    // Send event to booking-service to unlock seats and cancel booking
    if (txn.bookingId) {
      const failedEvent: PaymentBookingFailedEvent = {
        paymentId: txn.id,
        bookingId: txn.bookingId,
        showtimeId: txn.showtimeId!,
        userId: txn.userId,
        amount: txn.amount,
        method: txn.method,
        seatIds: txn.seatIds ?? [],
        reason: `Payment cancelled: ${reason}`
      };

      await this.paymentProducer.sendPaymentBookingFailedEvent(failedEvent);
      console.log(`📤 [PaymentService] Sent PaymentBookingFailedEvent for bookingId: ${txn.bookingId}`);
    }

    // Handle FnB order if exists
    if (txn.fnbOrderId) {
      const fnbFailedEvent: PaymentFnbFailedEvent = {
        paymentId: txn.id,
        fnbOrderId: txn.fnbOrderId,
        userId: txn.userId,
        amount: txn.amount,
        method: txn.method,
        message: 'Payment cancelled',
        reason: reason
      };

      await this.paymentProducer.sendPaymentFnbFailedEvent(fnbFailedEvent);
      console.log(`📤 [PaymentService] Sent PaymentFnbFailedEvent for fnbOrderId: ${txn.fnbOrderId}`);
    }
  }

  /**
   * Get payments by criteria with pagination
   */
  async getPaymentsByCriteria(
    criteria: PaymentCriteria,
    page: number,
    size: number,
    sortBy: string,
    sortDir: string
  ): Promise<PagedResponse<PaymentTransactionResponse>> {
    const direction = sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    // Apply filters from criteria
    if (criteria.userId) {
      queryBuilder.andWhere('payment.userId = :userId', { userId: criteria.userId });
    }
    if (criteria.bookingId) {
      queryBuilder.andWhere('payment.bookingId = :bookingId', { bookingId: criteria.bookingId });
    }
    if (criteria.status) {
      queryBuilder.andWhere('payment.status = :status', { status: criteria.status });
    }
    if (criteria.method) {
      queryBuilder.andWhere('payment.method = :method', { method: criteria.method });
    }
    if (criteria.fromDate) {
      queryBuilder.andWhere('payment.createdAt >= :fromDate', { fromDate: criteria.fromDate });
    }
    if (criteria.toDate) {
      queryBuilder.andWhere('payment.createdAt <= :toDate', { toDate: criteria.toDate });
    }

    // Apply sorting and pagination
    queryBuilder
      .orderBy(`payment.${sortBy}`, direction)
      .skip(page * size)
      .take(size);

    const [payments, totalElements] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(totalElements / size);

    const responses = payments.map(this.toResponse);

    return {
      data: responses,
      page,
      size,
      totalElements,
      totalPages
    };
  }

  /**
   * Convert entity to response DTO
   */
  private toResponse(txn: PaymentTransaction): PaymentTransactionResponse {
    return {
      id: txn.id,
      bookingId: txn.bookingId ?? '',
      userId: txn.userId,
      showtimeId: txn.showtimeId ?? '',
      seatIds: txn.seatIds ?? [],
      amount: txn.amount,
      method: txn.method,
      status: txn.status,
      transactionRef: txn.transactionRef,
      createdAt: txn.createdAt,
      updatedAt: txn.updatedAt
    };
  }
}

export default PaymentService;