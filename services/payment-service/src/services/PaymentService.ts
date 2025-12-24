import { PaymentProducer } from "../producer/PaymentProducer.js";
import { UserProfileClient } from "../adapter/client/UserProfileClient.js";
import { PaymentTransaction } from "../entities/PaymentTransaction.js";
import { PaymentStatus } from "../entities/PaymentStatus.js";
import type { BookingCreatedEvent } from "../events/BookingCreatedEvent.js";
import type { BookingFinalizedEvent } from "../events/BookingFinalizedEvent.js";
import type { FnbOrderCreatedEvent } from "../events/FnbOrderCreatedEvent.js";
import type { SeatUnlockedEvent } from "../events/SeatUnlockedEvent.js";
import type { PaymentBookingSuccessEvent } from "../events/PaymentBookingSuccessEvent.js";
import type { PaymentFnbSuccessEvent } from "../events/PaymentFnbSuccessEvent.js";
import type { PaymentBookingFailedEvent } from "../events/PaymentBookingFailedEvent.js";
import type { PaymentCriteria } from "../dto/request/PaymentCriteria.js";
import type { PagedResponse } from "../dto/response/PagedResponse.js";
import type { PaymentTransactionResponse } from "../dto/response/PaymentTransactionResponse.js";

/**
 * PaymentService
 *
 * Ported from the Java implementation. This service:
 * - creates pending transactions for bookings and FnB orders
 * - confirms payments from payment gateway callbacks
 * - updates amounts and statuses based on booking events
 * - exposes read methods for payments and paginated queries
 *
 * Note: This implementation assumes the repository and producer expose the
 * methods used below (existsByBookingId, existsByFnbOrderId, save,
 * findByTransactionRef, findByBookingId, findByUserId, findById,
 * findByCriteria). Adjust repository method names if your repository differs.
 */
export class PaymentService {
  private paymentProducer: PaymentProducer;
  private paymentRepository: PaymentRepository;
  private userProfileClient: UserProfileClient;

  constructor(
    paymentProducer: PaymentProducer,
    paymentRepository: PaymentRepository,
    userProfileClient: UserProfileClient
  ) {
    this.paymentProducer = paymentProducer;
    this.paymentRepository = paymentRepository;
    this.userProfileClient = userProfileClient;
  }

  /**
   * Create a pending transaction when a booking is created.
   */
  async createPendingTransaction(event: BookingCreatedEvent): Promise<void> {
    try {
      const exists = await this.paymentRepository.existsByBookingId(event.bookingId);
      if (exists) {
        console.warn(`[PaymentService] Transaction already exists for bookingId=${event.bookingId}. Skipping.`);
        return;
      }

      const pendingTxn: Partial<PaymentTransaction> = {
        bookingId: event.bookingId,
        userId: event.userId,
        showtimeId: event.showtimeId,
        seatIds: event.seatIds ?? [],
        amount: event.totalPrice, // keep as string/decimal representation per entity
        method: "UNKNOWN",
        status: PaymentStatus.PENDING,
        transactionRef: `TXN_INIT_${cryptoRandomUuid()}`,
      };

      await this.paymentRepository.save(pendingTxn as PaymentTransaction);
      console.info(`[PaymentService] PENDING Transaction created for bookingId=${event.bookingId}`);
    } catch (err) {
      console.error("[PaymentService] Error in createPendingTransaction:", err);
      throw err;
    }
  }

  /**
   * Create a pending transaction when an FnB order is created.
   */
  async createPendingTransactionForFnb(event: FnbOrderCreatedEvent): Promise<void> {
    try {
      const exists = await this.paymentRepository.existsByFnbOrderId(event.fnbOrderId);
      if (exists) {
        console.warn(`[PaymentService] Transaction already exists for fnbOrderId=${event.fnbOrderId}. Skipping.`);
        return;
      }

      const pendingTxn: Partial<PaymentTransaction> = {
        fnbOrderId: event.fnbOrderId,
        userId: event.userId,
        showtimeId: null,
        seatIds: [],
        amount: event.totalAmount,
        method: "UNKNOWN",
        status: PaymentStatus.PENDING,
        transactionRef: `TXN_FNB_${cryptoRandomUuid()}`,
      };

      await this.paymentRepository.save(pendingTxn as PaymentTransaction);
      console.info(
        `[PaymentService] PENDING Transaction created for fnbOrderId=${event.fnbOrderId} | amount=${event.totalAmount}`
      );
    } catch (err) {
      console.error("[PaymentService] Error in createPendingTransactionForFnb:", err);
      throw err;
    }
  }

  /**
   * Confirm payment success from payment gateway callback.
   *
   * @param appTransId - transaction reference (merchant/app transaction id)
   * @param merchantTransId - gateway transaction id (unused but kept for parity)
   * @param amountPaid - amount paid in smallest currency unit (e.g., VND)
   */
  async confirmPaymentSuccess(appTransId: string, merchantTransId: string | null, amountPaid: number): Promise<void> {
    try {
      const optionalTxn = await this.paymentRepository.findByTransactionRef(appTransId);
      if (!optionalTxn) {
        throw new Error(`Transaction not found for ref: ${appTransId}`);
      }

      const txn = optionalTxn as PaymentTransaction;

      if (txn.status === PaymentStatus.SUCCESS) {
        console.warn(`[PaymentService] Transaction ${appTransId} already SUCCESS. Ignoring callback.`);
        return;
      }

      // Compare amounts. Entity stores amount as string (decimal). Convert safely.
      const txnAmountNumber = parseDecimalToNumber(txn.amount);
      if (txnAmountNumber !== amountPaid) {
        console.error(
          `[PaymentService] Amount mismatch! Expected: ${txn.amount} (${txnAmountNumber}), Paid: ${amountPaid}`
        );
        return;
      }

      // Update DB
      txn.status = PaymentStatus.SUCCESS;
      txn.method = "ZALOPAY";
      await this.paymentRepository.save(txn);

      console.info(
        `[PaymentService] Payment SUCCESS for bookingId=${txn.bookingId} | fnbOrderId=${txn.fnbOrderId}`
      );

      // If booking transaction, emit booking success event
      if (txn.bookingId) {
        const bookingSuccessEvent: PaymentBookingSuccessEvent = {
          id: txn.id,
          bookingId: txn.bookingId,
          showtimeId: txn.showtimeId ?? null,
          userId: txn.userId,
          amount: txn.amount,
          method: "ZALOPAY",
          seatIds: txn.seatIds ?? [],
          note: "Payment confirmed via ZaloPay Callback",
        };
        await this.paymentProducer.sendPaymentBookingSuccessEvent(bookingSuccessEvent);
      }

      // If FnB transaction, award loyalty points and emit FnB success event
      if (txn.fnbOrderId) {
        // 10,000 VND = 1 point
        const divisor = 10000;
        const pointsEarned = Math.floor(txnAmountNumber / divisor);
        if (pointsEarned > 0) {
          console.info(
            `[PaymentService] Earning ${pointsEarned} loyalty points for FnB order ${txn.fnbOrderId} (amount: ${txn.amount})`
          );
          try {
            await this.userProfileClient.updateLoyaltyPoints(txn.userId, pointsEarned);
          } catch (err) {
            console.error("[PaymentService] Failed to update loyalty points:", err);
          }
        }

        const fnbSuccessEvent: PaymentFnbSuccessEvent = {
          id: txn.id,
          fnbOrderId: txn.fnbOrderId,
          userId: txn.userId,
          amount: txn.amount,
          method: "ZALOPAY",
          note: "Payment confirmed via ZaloPay Callback",
        };
        await this.paymentProducer.sendPaymentFnbSuccessEvent(fnbSuccessEvent);
      }
    } catch (err) {
      console.error("[PaymentService] Error in confirmPaymentSuccess:", err);
      throw err;
    }
  }

  /**
   * Update final amount after booking finalization.
   */
  async updateFinalAmount(event: BookingFinalizedEvent): Promise<void> {
    try {
      console.info(
        `[PaymentService] Updating Payment amount after finalization | bookingId=${event.bookingId} | newAmount=${event.finalPrice}`
      );

      const txns = await this.paymentRepository.findByBookingId(event.bookingId);
      const pendingTxn = txns.find((t) => t.status === PaymentStatus.PENDING);

      if (!pendingTxn) {
        console.warn(`[PaymentService] No PENDING transaction found for bookingId ${event.bookingId}. Skipping update.`);
        return;
      }

      pendingTxn.amount = event.finalPrice;
      await this.paymentRepository.save(pendingTxn);

      console.info(`[PaymentService] Updated transaction amount for bookingId ${event.bookingId} → ${event.finalPrice}`);
    } catch (err) {
      console.error("[PaymentService] Error in updateFinalAmount:", err);
      throw err;
    }
  }

  /**
   * Update status when seats are unlocked (e.g., payment timeout).
   */
  async updateStatus(event: SeatUnlockedEvent): Promise<void> {
    try {
      console.info(
        `[PaymentService] Updating payment status due to seat unlock | bookingId=${event.bookingId} | reason=${event.reason}`
      );

      const txns = await this.paymentRepository.findByBookingId(event.bookingId);
      const pendingTxn = txns.find((t) => t.status === PaymentStatus.PENDING);

      if (!pendingTxn) {
        console.warn(`[PaymentService] No PENDING transaction found for bookingId ${event.bookingId}. Skipping status update.`);
        return;
      }

      pendingTxn.status = PaymentStatus.EXPIRED;
      pendingTxn.transactionRef = `TXN_EXPIRED_${cryptoRandomUuid()}`;
      await this.paymentRepository.save(pendingTxn);

      console.info(`[PaymentService] Transaction marked as EXPIRED for bookingId ${event.bookingId}`);

      const expiredEvent: PaymentBookingFailedEvent = {
        id: pendingTxn.id,
        bookingId: pendingTxn.bookingId,
        userId: pendingTxn.userId,
        showtimeId: pendingTxn.showtimeId ?? null,
        amount: pendingTxn.amount,
        method: pendingTxn.method,
        seatIds: pendingTxn.seatIds ?? [],
        reason: `Payment expired: ${event.reason}`,
      };

      await this.paymentProducer.sendPaymentBookingFailedEvent(expiredEvent);
    } catch (err) {
      console.error("[PaymentService] Error in updateStatus:", err);
      throw err;
    }
  }

  /**
   * Get payments by user id.
   */
  async getPaymentsByUserId(userId: string): Promise<PaymentTransactionResponse[]> {
    const payments = await this.paymentRepository.findByUserId(userId);
    return payments.map((p) => this.toResponse(p));
  }

  /**
   * Get single payment by id.
   */
  async getPaymentById(id: string): Promise<PaymentTransactionResponse> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new Error(`Payment not found with id: ${id}`);
    }
    return this.toResponse(payment);
  }

  /**
   * Get payments by criteria with pagination and sorting.
   *
   * This method delegates to repository.findByCriteria which is expected to accept
   * (criteria, page, size, sortBy, sortDir) or a pageable object. If your repository
   * exposes a different signature, adapt the call accordingly.
   */
  async getPaymentsByCriteria(
    criteria: PaymentCriteria,
    page: number,
    size: number,
    sortBy: string,
    sortDir: "asc" | "desc"
  ): Promise<PagedResponse<PaymentTransactionResponse>> {
    const direction = sortDir === "desc" ? "DESC" : "ASC";

    // Delegate to repository. Expected to return an object with items and totalElements/totalPages.
    const pageResult = await this.paymentRepository.findByCriteria(criteria, {
      page,
      size,
      sortBy,
      sortDir: direction,
    });

    // pageResult is expected to be { items: PaymentTransaction[], totalElements: number, totalPages: number }
    const items = pageResult.items ?? [];
    const totalElements = pageResult.totalElements ?? 0;
    const totalPages = pageResult.totalPages ?? Math.ceil(totalElements / Math.max(1, size));

    const responses = items.map((t) => this.toResponse(t));

    return {
      data: responses,
      page,
      size,
      totalElements,
      totalPages,
    };
  }

  /**
   * Map entity to DTO response.
   */
  private toResponse(txn: PaymentTransaction): PaymentTransactionResponse {
    return {
      id: txn.id,
      bookingId: txn.bookingId ?? undefined,
      userId: txn.userId,
      showtimeId: txn.showtimeId ?? undefined,
      seatIds: txn.seatIds ?? undefined,
      amount: txn.amount,
      method: txn.method,
      status: txn.status,
      transactionRef: txn.transactionRef,
      createdAt: txn.createdAt,
      updatedAt: txn.updatedAt,
    };
  }
}

/* -------------------------
   Helper utilities
   ------------------------- */

/**
 * Parse decimal string (e.g., "12345.00") to integer smallest unit number.
 * This helper assumes amounts are provided in the main currency unit (VND)
 * and the callback amountPaid is in the same unit (long). Adjust if your
 * gateway uses smallest currency unit.
 */
function parseDecimalToNumber(decimalStr?: string | number | null): number {
  if (decimalStr == null) return 0;
  if (typeof decimalStr === "number") return Math.floor(decimalStr);
  // Remove commas, trim
  const cleaned = String(decimalStr).replace(/,/g, "").trim();
  // If contains decimal point, take integer part (gateway uses integer)
  const idx = cleaned.indexOf(".");
  const integerPart = idx >= 0 ? cleaned.substring(0, idx) : cleaned;
  const parsed = parseInt(integerPart, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Generate a short random UUID-like string for transactionRef suffix.
 * Uses crypto if available.
 */
function cryptoRandomUuid(): string {
  try {
    // Use crypto random values to create a UUID v4-like string
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    // set version bits (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(
      16,
      20
    )}-${hex.substring(20)}`;
  } catch {
    // fallback
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
  }
}
