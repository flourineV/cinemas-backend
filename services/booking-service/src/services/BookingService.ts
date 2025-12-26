import { DataSource, In, MoreThanOrEqual, Between, Repository } from 'typeorm';
import type { DeepPartial } from 'typeorm';
import { Logger } from 'winston';
import { BigNumber } from 'bignumber.js';
import { Booking } from '../models/Booking.js';
import {BookingSeat} from '../models/BookingSeat.js'
import {BookingPromotion} from '../models/BookingPromotion.js';
import {BookingFnb} from '../models/BookingFnb.js';
import {BookingStatus} from '../models/BookingStatus.js';
import {DiscountType} from '../models/DiscountType.js';
import type {CreateBookingRequest} from '../dto/request/CreateBookingRequest.js';
import type {FinalizeBookingRequest} from '../dto/request/FinalizeBookingRequest.js';
import type {BookingCriteria } from '../dto/request/BookingCriteria.js';
import type {SeatSelectionDetail} from '../dto/request/SeatSelectionDetail.js';
import type {BookingResponse} from '../dto/response/BookingResponse.js';
import type {PagedResponse} from '../dto/response/PagedResponse.js';
import type { ShowtimeResponse } from '../dto/external/ShowtimeResponse.js';
import type { SeatPriceResponse } from 'dto/external/SeatPriceResponse.js';
import type { PromotionValidationResponse } from 'dto/external/PromotionValidationResponse.js';
import type { FnbCalculationResponse } from 'dto/external/FnbCalculationResponse.js';
import type { MovieTitleResponse } from 'dto/external/MovieTitleResponse.js';
import type { SeatResponse } from 'dto/external/SeatResponse.js';
import type { FnbItemResponse } from 'dto/external/FnbItemResponse.js';
import type { RankAndDiscountResponse } from 'dto/external/RankAndDiscountResponse.js';
import type { BookingCreatedEvent } from '../events/booking/BookingCreatedEvent.js';
import type { BookingSeatMappedEvent } from '../events/booking/BookingSeatMappedEvent.js';
import type { BookingFinalizedEvent } from '../events/booking/BookingFinalizedEvent.js';
import type { BookingStatusUpdatedEvent } from '../events/booking/BookingStatusUpdatedEvent.js';
import type { BookingTicketGeneratedEvent } from '../events/notification/BookingTicketGeneratedEvent.js';
import type { BookingRefundedEvent } from '../events/booking/BookingRefundedEvent.js';
import type { SeatUnlockedEvent } from '../events/showtime/SeatUnlockedEvent.js';
import type { PaymentBookingSuccessEvent } from '../events/payment/PaymentBookingSuccessEvent.js';
import type { PaymentBookingFailedEvent } from '../events/payment/PaymentBookingFailedEvent.js';
import type { ShowtimeSuspendedEvent } from '../events/showtime/ShowtimeSuspendedEvent.js';
import type { SeatDetail } from '../events/notification/SeatDetail.js';
import type { FnbDetail } from '../events/notification/FnbDetail.js';
import type { PromotionDetail } from '../events/notification/PromotionDetail.js';
import {PricingClient} from '../client/PricingClient.js';
import {PromotionClient} from '../client/PromotionClient.js';
import {FnbClient} from '../client/FnbClient.js';
import {ShowtimeClient} from '../client/ShowtimeClient.js';
import {MovieClient} from '../client/MovieClient.js';
import {UserProfileClient} from '../client/UserProfileClient.js';
import { BookingProducer } from '../producer/BookingProducer.js';
import { SeatLockRedisService } from './SeatLockRedisService.js';
import { BookingMapper } from '../mapper/BookingMapper.js';
import {BookingException} from '../exception/BookingException.js';
import {BookingNotFoundException} from '../exception/BookingNotFoundException.js';
import { v4 as uuidv4 } from "uuid";

export class BookingService {
  private readonly logger: Logger;
  constructor(
    private readonly dataSource: DataSource,
    private readonly pricingClient: PricingClient,
    private readonly promotionClient: PromotionClient,
    private readonly fnbClient: FnbClient,
    private readonly showtimeClient: ShowtimeClient,
    private readonly movieClient: MovieClient,
    private readonly userProfileClient: UserProfileClient,
    private readonly bookingProducer: BookingProducer,
    private readonly seatLockRedisService: SeatLockRedisService
  ) {}

  async createBooking(request: CreateBookingRequest): Promise<BookingResponse> {
  if (!request.selectedSeats || request.selectedSeats.length === 0) {
    throw new BookingException('At least one seat must be selected');
  }

  this.logger.info(
    `Creating booking: showtime=${request.showtimeId}, seats=${request.selectedSeats.length}, user=${request.userId}, guest=${request.guestSessionId}`
  );

  return this.dataSource.transaction(async (manager) => {
    const bookingRepository = manager.getRepository(Booking);
    const bookingSeatRepository = manager.getRepository(BookingSeat);

    // ======== 1. VALIDATE SHOWTIME ========
    const showtime = await this.showtimeClient.getShowtimeById(request.showtimeId);
    if (!showtime) throw new BookingException('Showtime not found');
    if (showtime.status === 'SUSPENDED') throw new BookingException('This showtime has been suspended');
    if (new Date(showtime.startTime) < new Date()) throw new BookingException('Cannot book a showtime that has already started');

    // ======== 2. VALIDATE OWNERSHIP ========
    if (!request.userId && !request.guestSessionId)
      throw new BookingException('Either userId or guestSessionId must be provided');
    if (request.userId && request.guestSessionId)
      throw new BookingException('Cannot provide both userId and guestSessionId');

    const seatIds = request.selectedSeats.map(s => s.seatId);

    const ownsSeats = request.guestSessionId
      ? await this.seatLockRedisService.validateGuestSessionOwnsSeats(request.showtimeId, seatIds, request.guestSessionId)
      : await this.seatLockRedisService.validateUserOwnsSeats(request.showtimeId, seatIds, request.userId!);

    if (!ownsSeats) {
      throw new BookingException(request.guestSessionId
        ? 'Guest session does not own the selected seats'
        : 'User does not own the selected seats');
    }

    // ======== 3. SNAPSHOT DATA ========
    const movie = await this.movieClient.getMovieTitleById(showtime.movieId);
    const seatId = request.selectedSeats[0]?.seatId;
    if(!seatId){
      throw new BookingException('At least one seat must be selected');
    }
    const seatInfo = request.selectedSeats.length > 0
      ? await this.showtimeClient.getSeatInfoById(seatId)
      : undefined;

    // Construct booking object
    const bookingData: DeepPartial<Booking> = {
      userId: request.userId,
      showtimeId: request.showtimeId,
      movieId: showtime.movieId,
      movieTitle: movie?.title,
      movieTitleEn: movie?.titleEn,
      theaterName: showtime.theaterName,
      theaterNameEn: showtime.theaterNameEn,
      roomName: seatInfo?.roomName,
      roomNameEn: seatInfo?.roomNameEn,
      showDateTime: new Date(showtime.startTime),
      status: BookingStatus.PENDING,
      totalPrice: "0",
      discountAmount: "0",
      finalPrice: "0",
      guestName: request.guestName,
      guestEmail: request.guestEmail,
    } as DeepPartial<Booking>;

    const booking = bookingRepository.create(bookingData);

    // ======== 4. CREATE SEATS ========
    const seats: BookingSeat[] = [];
    let totalSeatPrice = new BigNumber(0);

    for (const seatDetail of request.selectedSeats) {
      const seatPrice = await this.pricingClient.getSeatPrice(seatDetail.seatType, seatDetail.ticketType);
      if (!seatPrice || !seatPrice.basePrice) throw new BookingException(`Cannot get price for seat: ${seatDetail.seatId}`);

      const seatInfo = await this.showtimeClient.getSeatInfoById(seatDetail.seatId);
      const price = new BigNumber(seatPrice.basePrice);
      totalSeatPrice = totalSeatPrice.plus(price);

      const bookingSeat = bookingSeatRepository.create({
        seatId: seatDetail.seatId,
        seatNumber: seatInfo?.seatNumber ?? undefined,
        seatType: seatDetail.seatType,
        ticketType: seatDetail.ticketType,
        price: price.toString(),
        booking: booking,
      });
      seats.push(bookingSeat);
    }

    booking.seats = seats;
    booking.totalPrice = totalSeatPrice.toString();
    booking.finalPrice = totalSeatPrice.toString();

    const savedBooking = await bookingRepository.save(booking);

    this.logger.info(
      `Booking created: ${savedBooking.id} | total=${totalSeatPrice.toString()} | seats=${seats.length}`
    );

    // ======== 5. SEND EVENTS ========
    await this.bookingProducer.sendBookingCreatedEvent({
      bookingId: savedBooking.id,
      userId: savedBooking.userId ?? '',
      guestName: savedBooking.guestName ?? '',
      guestEmail: savedBooking.guestEmail?? '',
      showtimeId: savedBooking.showtimeId,
      seatIds,
      totalPrice: savedBooking.totalPrice
    });

    await this.bookingProducer.sendBookingSeatMappedEvent({
      bookingId: savedBooking.id,
      showtimeId: savedBooking.showtimeId,
      seatIds,
      userId: savedBooking.userId ?? '',
      guestName: savedBooking.guestName ?? '',
      guestEmail: savedBooking.guestEmail ?? ''
    });

    return BookingMapper.toBookingResponse(savedBooking);
  });
}


  async handleSeatUnlocked(data: SeatUnlockedEvent): Promise<void> {
    this.logger.warn(
      `Received SeatUnlocked event: bookingId=${data.bookingId}, seats=${data.seatIds.length}, reason=${data.reason}`
    );

    if (!data.bookingId) {
      this.logger.info(
        'SeatUnlockedEvent received without bookingId (manual unlock). No booking to update.'
      );
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const bookingRepository = manager.getRepository(Booking);
      const bookingFnbRepository = manager.getRepository(BookingFnb);
      const bookingPromotionRepository = manager.getRepository(BookingPromotion);
      const bookingSeatRepository = manager.getRepository(BookingSeat);

      const booking = await bookingRepository.findOne({
        where: { id: data.bookingId },
      });

      if (
        !booking ||
        (booking.status !== BookingStatus.PENDING &&
          booking.status !== BookingStatus.AWAITING_PAYMENT)
      ) {
        this.logger.warn(
          `Booking ${data.bookingId} not found or status is ${booking?.status}. Skipping unlock handler.`
        );
        return;
      }

      await bookingFnbRepository.delete({ booking: { id: booking.id } });
      await bookingPromotionRepository.delete({ booking: { id: booking.id } });
      await bookingSeatRepository.delete({ booking: { id: booking.id } });

      await this.updateBookingStatusInternal(
        manager,
        booking,
        BookingStatus.EXPIRED
      );
    });
  }

  async handlePaymentSuccess(data: PaymentBookingSuccessEvent): Promise<void> {
    this.logger.info(`Received PaymentCompleted event for booking: ${data.bookingId}`);

    await this.dataSource.transaction(async (manager) => {
      const bookingRepository = manager.getRepository(Booking);

      const booking = await bookingRepository.findOne({
        where: { id: data.bookingId },
        relations: ['seats'],
      });

      if (
        !booking ||
        (booking.status !== BookingStatus.PENDING &&
          booking.status !== BookingStatus.AWAITING_PAYMENT)
      ) {
        this.logger.warn(
          `Booking ${data.bookingId} not found or status is not PENDING/AWAITING_PAYMENT. Current status: ${booking?.status}`
        );
        return;
      }

      booking.paymentMethod = data.method;
      booking.paymentId = data.paymentId;

      await this.updateBookingStatusInternal(
        manager,
        booking,
        BookingStatus.CONFIRMED
      );

      // Calculate loyalty points
      if (booking.userId) {
        const divisor = new BigNumber(10000);
        const pointsEarned = new BigNumber(booking.finalPrice)
          .dividedBy(divisor)
          .integerValue(BigNumber.ROUND_DOWN)
          .toNumber();

        if (pointsEarned > 0) {
          this.logger.info(
            `💎 Earning ${pointsEarned} loyalty points for booking ${booking.id} (amount: ${booking.finalPrice})`
          );
          try {
            await this.userProfileClient.updateLoyaltyPoints(
              booking.userId,
              booking.id,
              booking.bookingCode,
              pointsEarned,
              booking.finalPrice
            );
          } catch (error) {
            this.logger.error(
              `Failed to update loyalty points: ${(error as Error).message}`
            );
          }
        }
      }

      // Send notification event
      try {
        const ticketEvent = await this.buildBookingTicketGeneratedEvent(booking);
        await this.bookingProducer.sendBookingTicketGeneratedEvent(ticketEvent);
        this.logger.info(
          `📧 Sent BookingTicketGeneratedEvent for booking ${booking.id}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to send booking ticket notification for booking ${booking.id}: ${(error as Error).message}`
        );
      }
    });
  }

  async handlePaymentFailed(data: PaymentBookingFailedEvent): Promise<void> {
    this.logger.error(
      `Received PaymentFailed event for booking: ${data.bookingId} | Reason: ${data.reason}`
    );

    await this.dataSource.transaction(async (manager) => {
      const bookingRepository = manager.getRepository(Booking);
      const bookingFnbRepository = manager.getRepository(BookingFnb);
      const bookingPromotionRepository = manager.getRepository(BookingPromotion);

      const booking = await bookingRepository.findOne({
        where: { id: data.bookingId },
      });

      if (
        !booking ||
        (booking.status !== BookingStatus.PENDING &&
          booking.status !== BookingStatus.AWAITING_PAYMENT)
      ) {
        this.logger.warn(
          `Booking ${data.bookingId} not found or status is not PENDING/AWAITING_PAYMENT. Skipping failure handler.`
        );
        return;
      }

      await bookingFnbRepository.delete({ booking: { id: booking.id } });
      await bookingPromotionRepository.delete({ booking: { id: booking.id } });

      await this.updateBookingStatusInternal(
        manager,
        booking,
        BookingStatus.CANCELLED
      );
    });
  }

  async finalizeBooking(
    bookingId: string,
    request: FinalizeBookingRequest
  ): Promise<BookingResponse> {
    return this.dataSource.transaction(async (manager) => {
      const bookingRepository = manager.getRepository(Booking);
      const bookingFnbRepository = manager.getRepository(BookingFnb);
      const bookingPromotionRepository = manager.getRepository(BookingPromotion);

      const booking = await bookingRepository.findOne({
        where: { id: bookingId },
        relations: ['seats'],
      });

      if (!booking) {
        throw new BookingNotFoundException(bookingId);
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new BookingException('Booking đã được thanh toán hoặc hết hạn.');
      }

      // ======== Calculate total ========
      let fnbPrice = new BigNumber(0);

      if (request.fnbItems && request.fnbItems.length > 0) {
        await bookingFnbRepository.delete({ booking: { id: bookingId } });
        fnbPrice = await this.processFnbItems(manager, booking, request.fnbItems);
      }

      const seatPrice = booking.seats.reduce(
        (sum, seat) => sum.plus(seat.price),
        new BigNumber(0)
      );

      const totalPrice = seatPrice.plus(fnbPrice);
      booking.totalPrice = totalPrice.toString();

      let discountAmount = new BigNumber(0);
      let finalPrice = totalPrice;

      // ======== Apply discounts (mutually exclusive) ========

      // Priority 1: Promotion code
      if (request.promotionCode?.trim()) {
        await bookingPromotionRepository.delete({ booking: { id: bookingId } });
        await this.processPromotion(manager, booking, request.promotionCode);

        this.logger.info(`Applied promotion code: ${request.promotionCode}`);
      }
      // Priority 2: Refund voucher
      else if (request.refundVoucherCode?.trim()) {
        const voucher = await this.promotionClient.markRefundVoucherAsUsed(
          request.refundVoucherCode
        );

        if (!voucher) {
          throw new BookingException('Không thể sử dụng voucher hoàn tiền.');
        }

        if (voucher.userId && voucher.userId !== booking.userId) {
          throw new BookingException('Voucher không thuộc về người dùng.');
        }

        if (voucher.isUsed) {
          throw new BookingException('Voucher đã được sử dụng.');
        }

        if (voucher.expiredAt && new Date(voucher.expiredAt) < new Date()) {
          throw new BookingException('Voucher đã hết hạn.');
        }

        const voucherValue = new BigNumber(voucher.value || 0);
        finalPrice = BigNumber.max(
          totalPrice.minus(voucherValue),
          new BigNumber(0)
        );
        discountAmount = voucherValue;

        booking.discountAmount = discountAmount.toString();
        booking.finalPrice = finalPrice.integerValue(BigNumber.ROUND_HALF_UP).toString();

        this.logger.info(
          `Applied refund voucher: ${voucher.code} | value=${voucherValue.toString()}`
        );
      }
      // Priority 3: Rank discount
      else {
        const rankInfo = await this.userProfileClient.getUserRankAndDiscount(
          booking.userId!
        );

        if (
          rankInfo &&
          rankInfo.discountRate &&
          new BigNumber(rankInfo.discountRate).isGreaterThan(0)
        ) {
          discountAmount = totalPrice
            .multipliedBy(rankInfo.discountRate)
            .integerValue(BigNumber.ROUND_HALF_UP);
          finalPrice = BigNumber.max(totalPrice.minus(discountAmount),BigNumber(0));

          booking.discountAmount = discountAmount.toString();
          booking.finalPrice = finalPrice.toString();

          this.logger.info(
            `Applied rank discount: ${rankInfo.rankName} (${rankInfo.discountRate})`
          );
        } else {
          booking.discountAmount = "0";
          booking.finalPrice = totalPrice.toString();
        }
      }

      // ======== Save & send event ========
      booking.status = BookingStatus.AWAITING_PAYMENT;
      booking.updatedAt = new Date();
      booking.language = request.language || 'vi';

      await bookingRepository.save(booking);

      await this.bookingProducer.sendBookingFinalizedEvent({
          bookingId: booking.id,
          userId: booking.userId,
          showtimeId: booking.showtimeId,
          finalPrice: booking.finalPrice
        } as BookingFinalizedEvent
      );

      this.logger.info(
        `Booking ${bookingId} finalized: Total=${booking.totalPrice.toString()}, Final=${booking.finalPrice.toString()}, Discount=${booking.discountAmount.toString()}`
      );

      return BookingMapper.toBookingResponse(booking);
    });
  }

  private async processFnbItems(
    manager: any,
    booking: Booking,
    fnbItems: FinalizeBookingRequest['fnbItems']
  ): Promise<BigNumber> {
    const bookingFnbRepository = manager.getRepository(BookingFnb);

    const fnbRequest = {
      selectedFnbItems: (fnbItems ?? []).map((item) => ({
        fnbItemId: item.fnbItemId,
        quantity: item.quantity,
      })),
    };

    const fnbResponse = await this.fnbClient.calculatePrice(fnbRequest);

    if (!fnbResponse || !fnbResponse.calculatedFnbItems) {
      throw new BookingException('Không nhận được dữ liệu F&B từ service FNB.');
    }

    const bookingFnbs = fnbResponse.calculatedFnbItems.map((item) =>
      bookingFnbRepository.create({
        fnbItemId: item.fnbItemId,
        unitPrice: new BigNumber(item.unitPrice),
        quantity: item.quantity,
        totalFnbPrice: new BigNumber(item.totalFnbItemPrice),
        booking,
      })
    );

    await bookingFnbRepository.save(bookingFnbs);

    return new BigNumber(fnbResponse.totalFnbPrice);
  }

  private async processPromotion(
    manager: any,
    booking: Booking,
    promoCode: string
  ): Promise<void> {
    const bookingPromotionRepository = manager.getRepository(BookingPromotion);

    const validationResponse = await this.promotionClient.validatePromotionCode(
      promoCode
    );

    if (
      !validationResponse ||
      !validationResponse.discountValue ||
      !validationResponse.discountType
    ) {
      throw new BookingException(
        'Lỗi xử lý khuyến mãi: Thiếu thông tin loại hoặc giá trị giảm.'
      );
    }

    const canUse = await this.promotionClient.canUsePromotion(
      booking.userId!, // !
      promoCode
    );
    if (!canUse) {
      throw new BookingException('Người dùng đã sử dụng mã khuyến mãi này rồi!');
    }

    const totalBeforeDiscount = booking.totalPrice;
    const discountValue = new BigNumber(validationResponse.discountValue);
    const discountType = validationResponse.discountType;

    this.logger.info(
      `🎟️ Processing promotion: code=${promoCode}, type=${discountType}, value=${discountValue.toString()}, totalPrice=${totalBeforeDiscount.toString()}`
    );

    let calculatedDiscountAmount: BigNumber;

    if (discountType === DiscountType.PERCENTAGE) {
      calculatedDiscountAmount = new BigNumber(totalBeforeDiscount)
        .times(discountValue)
        .dividedBy(100)
        .decimalPlaces(2, BigNumber.ROUND_HALF_UP);
      this.logger.info(
        `📊 Calculated PERCENTAGE discount: ${totalBeforeDiscount.toString()} * ${discountValue.toString()}% / 100 = ${calculatedDiscountAmount.toString()}`
      );
    } else if (discountType === DiscountType.FIXED_AMOUNT) {
      calculatedDiscountAmount = discountValue;
      this.logger.info(
        `💵 Using FIXED_AMOUNT discount: ${calculatedDiscountAmount.toString()}`
      );
    } else {
      calculatedDiscountAmount = new BigNumber(0);
    }

    const discountAmount = calculatedDiscountAmount.decimalPlaces(
      2,
      BigNumber.ROUND_HALF_UP
    );
    const newFinalPrice = new BigNumber(totalBeforeDiscount).minus(discountAmount);

    // Validate: don't allow 100% discount (finalPrice = 0) because ZaloPay doesn't accept it
    if (newFinalPrice.isLessThanOrEqualTo(0)) {
      throw new BookingException(
        'Khuyến mãi này không thể áp dụng vì sẽ làm tổng tiền = 0. Vui lòng chọn khuyến mãi khác hoặc không dùng khuyến mãi.'
      );
    }

    booking.discountAmount = discountAmount.toString();
    booking.finalPrice = newFinalPrice.decimalPlaces(2, BigNumber.ROUND_HALF_UP).toString();

    const bookingPromotion = bookingPromotionRepository.create({
      promotionCode: promoCode,
      discountType,
      discountValue,
      booking,
    });

    await bookingPromotionRepository.save(bookingPromotion);

    // Record promotion usage
    try {
      await this.promotionClient.recordPromotionUsage(
        booking.userId!, //!
        promoCode,
        booking.id
      );
    } catch (error) {
      this.logger.error(
        `Failed to record promotion usage: ${(error as Error).message}`
      );
      // Don't fail the booking if promotion recording fails
    }
  }

  async getBookingsByCriteria(
    criteria: BookingCriteria,
    page: number,
    size: number,
    sortBy: string,
    sortType: string
  ): Promise<PagedResponse<BookingResponse>> {
    const bookingRepository = this.dataSource.getRepository(Booking);

    // If username search is provided, get matching userIds first
    if (criteria.username?.trim()) {
      try {
        const matchingUserIds = await this.userProfileClient.searchUserIdsByUsername(
          criteria.username
        );
        if (matchingUserIds.length === 0) {
          return {
            data: [],
            page,
            size,
            totalElements: 0,
            totalPages: 0,
          };
        }
        criteria.userIds = matchingUserIds;
        this.logger.debug(
          `Found ${matchingUserIds.length} matching users for username '${criteria.username}'`
        );
      } catch (error) {
        this.logger.error(
          `Failed to search userIds by username: ${(error as Error).message}`
        );
      }
    }

    const order = sortType.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const [bookings, totalElements] = await bookingRepository.findAndCount({
      where: this.buildWhereClause(criteria),
      relations: ['seats'],
      order: { [sortBy]: order },
      skip: page * size,
      take: size,
    });

    let bookingResponses = bookings.map((b) =>
      BookingMapper.toBookingResponse(b)
    );

    // Batch fetch userNames
    const userIds = [
      ...new Set(
        bookingResponses.map((r) => r.userId).filter((id) => id !== null && id !== undefined)
      ),
    ];

    let userNames: Map<string, string> = new Map();;
    if (userIds.length > 0) {
      try {
        const userNameRecord = await this.userProfileClient.getBatchUserNames(userIds!);
        userNames = new Map<string, string>(
          Object.entries(userNameRecord)
        );
      } catch (error) {
        this.logger.error(
          `Failed to fetch batch user names: ${(error as Error).message}`
        );
      }
    }

    // Enrich responses with fullName
    bookingResponses = bookingResponses.map((response) => ({
      ...response,
      fullName: response.userId ? userNames.get(response.userId) || null : null,
    }));

    return {
      data: bookingResponses,
      page,
      size,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
    };
  }

  private buildWhereClause(criteria: BookingCriteria): any {
    const where: any = {};

    if (criteria.userIds && criteria.userIds.length > 0) {
      where.userId = In(criteria.userIds);
    }

    if (criteria.showtimeId) {
      where.showtimeId = criteria.showtimeId;
    }

    if (criteria.movieId) {
      where.movieId = criteria.movieId;
    }

    if (criteria.status) {
      where.status = criteria.status;
    }

    if (criteria.bookingCode) {
      where.bookingCode = criteria.bookingCode;
    }

    if (criteria.fromDate && criteria.toDate) {
      where.createdAt = Between(
        new Date(criteria.fromDate),
        new Date(criteria.toDate)
      );
    } else if (criteria.fromDate) {
      where.createdAt = MoreThanOrEqual(new Date(criteria.fromDate));
    }

    return where;
  }

  async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const bookingRepository = manager.getRepository(Booking);
      const booking = await bookingRepository.findOne({
        where: { id: bookingId },
        relations: ['seats'],
      });

      if (!booking) {
        throw new BookingException(`Booking not found: ${bookingId}`);
      }

      await this.updateBookingStatusInternal(manager, booking, newStatus);
    });
  }

  private async updateBookingStatusInternal(
    manager: any,
    booking: Booking,
    newStatus: BookingStatus
  ): Promise<void> {
    const bookingRepository = manager.getRepository(Booking);
    const oldStatus = booking.status;

    if (oldStatus === BookingStatus.CONFIRMED && newStatus !== BookingStatus.CONFIRMED) {
      this.logger.warn(
        `Attempted to update CONFIRMED booking ${booking.id} from ${oldStatus} to ${newStatus}. Skipping.`
      );
      return;
    }

    booking.status = newStatus;
    booking.updatedAt = new Date();
    await bookingRepository.save(booking);

    this.logger.info(
      `Status updated: Booking ${booking.id} from ${oldStatus} to ${newStatus}.`
    );

    // Update promotion usage status
    try {
      await this.promotionClient.updatePromotionUsageStatus(
        booking.id,
        newStatus
      );
    } catch (error) {
      this.logger.error(
        `Failed to update promotion usage status: ${(error as Error).message}`
      );
    }

    const seatIds = booking.seats.map((s) => s.seatId);

    if (
      newStatus === BookingStatus.CANCELLED ||
      newStatus === BookingStatus.EXPIRED ||
      newStatus === BookingStatus.REFUNDED
    ) {
      await this.bookingProducer.sendSeatUnlockedEvent({
          showtimeId: booking.showtimeId,
          bookingId: booking.id,
          seatIds: seatIds,
          reason: newStatus
        } as SeatUnlockedEvent
      );
    }

    await this.bookingProducer.sendBookingStatusUpdatedEvent({
        bookingId: booking.id,
        showtimeId: booking.showtimeId,
        seatIds: seatIds,
        newStatus: newStatus,
        previousStatus: oldStatus
      } as BookingStatusUpdatedEvent
    );
  }

  private async buildBookingTicketGeneratedEvent(
    booking: Booking
  ): Promise<BookingTicketGeneratedEvent> {
    const bookingFnbRepository = this.dataSource.getRepository(BookingFnb);
    const bookingPromotionRepository = this.dataSource.getRepository(BookingPromotion);

    const showtime = await this.showtimeClient.getShowtimeById(booking.showtimeId);
    if (!showtime) {
      throw new BookingException(
        `Không thể lấy thông tin suất chiếu cho booking ${booking.id}`
      );
    }

    const movie = await this.movieClient.getMovieTitleById(showtime.movieId);
    if (!movie) {
      throw new BookingException(
        `Không thể lấy thông tin phim cho booking ${booking.id}`
      );
    }

    const roomName =
      booking.seats.length === 0
        ? 'Unknown Room'
        : (await this.showtimeClient.getSeatInfoById(booking.seats[0]!.seatId))
            ?.roomName;

    const seatDetails: SeatDetail[] = await Promise.all(
      booking.seats.map(async (seat) => {
        const seatInfo = await this.showtimeClient.getSeatInfoById(seat.seatId);
        if (!seatInfo) {
          throw new BookingException(`Không tìm thấy thông tin ghế ${seat.seatId}`);
        }
        return {
          seatName: seatInfo.seatNumber,
          seatType: seat.seatType,
          ticketType: seat.ticketType,
          quantity: 1,
          price: seat.price} as SeatDetail;
      })
    );

    const bookingFnbs = await bookingFnbRepository.find({
      where: { booking: { id: booking.id } },
    });

    const fnbDetails: FnbDetail[] = await Promise.all(
      bookingFnbs.map(async (fnb) => {
        const fnbInfo = await this.fnbClient.getFnbItemById(fnb.fnbItemId);
        const itemName = fnbInfo?.name || 'Unknown Item';
        return {
          itemName: itemName,
          quantity: fnb.quantity,
          unitPrice: fnb.unitPrice,
          totalPrice: fnb.totalFnbPrice
        } as FnbDetail;
      })
    );

    const promo = await bookingPromotionRepository.findOne({
      where: { booking: { id: booking.id } },
    });
    const promotionDetail = promo
      ? {code: promo.promotionCode, discountAmount: booking.discountAmount} as PromotionDetail
      : null;
    if (!booking.userId) {
      throw new BookingException('Không tìm thấy booking.userId');
    }
    const rank = await this.userProfileClient.getUserRankAndDiscount(booking.userId);

    let rankDiscountAmount = new BigNumber(0);
    let rankDiscountRate = new BigNumber(0);
    let rankName = 'Bronze';

    if (rank && rank.discountRate) {
      rankDiscountRate = new BigNumber(rank.discountRate);
      rankDiscountAmount = new BigNumber(booking.totalPrice)
        .times(rankDiscountRate)
        .decimalPlaces(2, BigNumber.ROUND_HALF_UP);
      rankName = rank.rankName;
    }

    return {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        userId: booking.userId,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        movieTitle: movie.title,
        cinemaName: showtime.theaterName,
        roomName: roomName,
        showDateTime: showtime.startTime,
        seats: seatDetails,
        fnbs: fnbDetails,
        promotion: promotionDetail,
        totalPrice: booking.totalPrice,
        rankName: rankName,
        rankDiscountAmount: rankDiscountAmount.toString(),
        finalPrice: booking.finalPrice,
        paymentMethod: booking.paymentMethod,
        createdAt: booking.createdAt.toISOString(),
        language: booking.language || 'vi'
    } as BookingTicketGeneratedEvent;
  }

  async getBookingById(id: string): Promise<BookingResponse> {
    const bookingRepository = this.dataSource.getRepository(Booking);
    const booking = await bookingRepository.findOne({
      where: { id },
      relations: ['seats'],
    });

    if (!booking) {
      throw new BookingException(`Booking not found: ${id}`);
    }

    const response = BookingMapper.toBookingResponse(booking);

    // Enrich with fullName
    if (response.userId) {
      try {
        const userNames = await this.userProfileClient.getBatchUserNames([
          response.userId,
        ]);
        response.fullName = userNames[response.userId] || null;
      } catch (error) {
        this.logger.error(
          `Failed to fetch user name for booking ${id}: ${(error as Error).message}`
        );
      }
    }

    return response;
  }

  async getBookingsByUser(userId: string): Promise<BookingResponse[]> {
    const bookingRepository = this.dataSource.getRepository(Booking);
    const bookings = await bookingRepository.find({
      where: { userId },
      relations: ['seats'],
      order: { createdAt: 'DESC' },
    });

    let responses = bookings.map((b) => BookingMapper.toBookingResponse(b));

    if (responses.length === 0) {
      return responses;
    }

    // Enrich with fullName
    if (userId) {
      try {
        const userNames = await this.userProfileClient.getBatchUserNames([userId]);
        const fullName = userNames[userId] ?? null;
        responses = responses.map((r) => ({ ...r, fullName }));
      } catch (error) {
        this.logger.error(
          `Failed to fetch user name for userId ${userId}: ${(error as Error).message}`
        );
      }
    }

    return responses;
  }

  async cancelBooking(bookingId: string, userId: string): Promise<BookingResponse> {
    return this.dataSource.transaction(async (manager) => {
      const bookingRepository = manager.getRepository(Booking);
      const booking = await bookingRepository.findOne({
        where: { id: bookingId },
        relations: ['seats'],
      });

      if (!booking) {
        throw new BookingNotFoundException(bookingId);
      }

      // Validate ownership
      if (booking.userId !== userId) {
        throw new BookingException("You don't own this booking");
      }

      // Only CONFIRMED bookings can be cancelled
      if (booking.status !== BookingStatus.CONFIRMED) {
        throw new BookingException(
          `Only confirmed bookings can be cancelled. Current status: ${booking.status}`
        );
      }

      // Check showtime timing (must cancel at least 60 minutes before)
      const showtime = await this.showtimeClient.getShowtimeById(
        booking.showtimeId
      );
      if (!showtime) {
        throw new BookingException('Showtime not found');
      }

      const now = new Date();
      const startTime = new Date(showtime.startTime);

      if (now > new Date(startTime.getTime() - 60 * 60 * 1000)) {
        throw new BookingException(
          'Cannot cancel booking less than 60 minutes before showtime'
        );
      }

      // Check monthly cancellation limit (2 times per month)
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0
      );
      const cancelCount = await bookingRepository.count({
        where: {
          userId,
          status: BookingStatus.REFUNDED,
          updatedAt: MoreThanOrEqual(startOfMonth),
        },
      });

      if (cancelCount >= 2) {
        throw new BookingException(
          'You have reached the monthly cancellation limit (2 times per month)'
        );
      }

      // Create refund voucher
      const refundValue = booking.finalPrice;
      try {
        await this.promotionClient.createRefundVoucher(userId, refundValue);
        this.logger.info(
          `Refund voucher created for booking ${bookingId} | user=${userId} | value=${refundValue.toString()}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to create refund voucher for booking ${bookingId}: ${(error as Error).message}`
        );
        throw new BookingException('Failed to create refund voucher');
      }

      // Update booking status to REFUNDED
      await this.updateBookingStatusInternal(
        manager,
        booking,
        BookingStatus.REFUNDED
      );

      this.logger.info(
        `Booking ${bookingId} refunded by user ${userId}. Voucher created with value ${refundValue.toString()}`
      );

      return BookingMapper.toBookingResponse(booking);
    });
  }

  async handleShowtimeSuspended(event: ShowtimeSuspendedEvent): Promise<void> {
    this.logger.warn(
      `Showtime ${event.showtimeId} suspended. Reason: ${event.reason}. Finding affected bookings...`
    );

    await this.dataSource.transaction(async (manager) => {
      const bookingRepository = manager.getRepository(Booking);

      let affectedBookings: Booking[];

      if (event.affectedBookingIds && event.affectedBookingIds.length > 0) {
        affectedBookings = await bookingRepository.find({
          where: { id: In(event.affectedBookingIds) },
          relations: ['seats'],
        });
      } else {
        affectedBookings = await bookingRepository.find({
          where: {
            showtimeId: event.showtimeId,
            status: BookingStatus.CONFIRMED,
          },
          relations: ['seats'],
        });
      }

      if (affectedBookings.length === 0) {
        this.logger.info(
          `No confirmed user bookings found for suspended showtime ${event.showtimeId}`
        );
        return;
      }

      for (const booking of affectedBookings) {
        if (booking.status !== BookingStatus.CONFIRMED) continue;

        const refundValue = booking.totalPrice;
        let refundMethod = 'UNKNOWN';

        // CASE 1: REGISTERED USER -> Refund as voucher
        if (booking.userId) {
          try {
            await this.promotionClient.createRefundVoucher(
              booking.userId,
              refundValue
            );
            refundMethod = 'VOUCHER';
            this.logger.info(
              `SYSTEM REFUND: Created VOUCHER for User ${booking.userId} - Booking ${booking.id} - Value ${refundValue.toString()} (totalPrice before discount)`
            );
          } catch (error) {
            this.logger.error(
              `Error creating voucher for user ${booking.userId}: ${(error as Error).message}`
            );
            refundMethod = 'ERROR_VOUCHER';
          }
        } else {
          refundMethod = 'COUNTER';
          this.logger.info(
            `SYSTEM REFUND: Marked Booking ${booking.id} (Guest) for COUNTER refund - Value ${refundValue.toString()}.`
          );
        }

        await this.updateBookingStatusInternal(
          manager,
          booking,
          BookingStatus.REFUNDED
        );

        await this.bookingProducer.sendBookingRefundedEvent(
          {
            bookingId: booking.id,
            userId: booking.userId ?? uuidv4(),
            guestName: booking.guestName ?? "",
            guestEmail: booking.guestEmail ?? "",
            showtimeId: booking.showtimeId,
            refundedValue: refundValue,
            refundMethod: refundMethod,
            reason: event.reason,
        }
        );
      }
    });
  }

  async deleteBooking(id: string): Promise<void> {
    const bookingRepository = this.dataSource.getRepository(Booking);
    await bookingRepository.delete(id);
  }

  async backfillMovieIds(): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
        this.logger.info('Starting backfill of movieIds for bookings with null movieId');

        const bookingRepository = this.dataSource.getRepository(Booking);
        const bookingsWithoutMovieId = await bookingRepository.find({
        where: { movieId: null as any },
        });

        if (bookingsWithoutMovieId.length === 0) {
        this.logger.info('No bookings found with null movieId');
        return 0;
        }

        let successCount = 0;
        let failCount = 0;

        for (const booking of bookingsWithoutMovieId) {
        try {
            const showtime = await this.showtimeClient.getShowtimeById(
            booking.showtimeId
            );
            if (showtime && showtime.movieId) {
            booking.movieId = showtime.movieId;
            await bookingRepository.save(booking);
            successCount++;
            this.logger.debug(
                `Updated booking ${booking.id} with movieId ${showtime.movieId}`
            );
            } else {
            failCount++;
            this.logger.warn(
                `Could not get movieId for booking ${booking.id} (showtime: ${booking.showtimeId})`
            );
            }
        } catch (error) {
            failCount++;
            this.logger.error(
            `Error updating booking ${booking.id}: ${(error as Error).message}`
            );
        }
        }

        this.logger.info(
        `Backfill completed: ${successCount} updated, ${failCount} failed out of ${bookingsWithoutMovieId.length} total`
        );

        return successCount;
    })
  }

  async hasUserBookedMovie(userId: string, movieId: string): Promise<boolean> {
    const bookingRepository = this.dataSource.getRepository(Booking);
    const bookings = await bookingRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return bookings.some(
      (b) => b.movieId === movieId && b.status === BookingStatus.CONFIRMED
    );
  }

  async getBookingCountByUserId(userId: string): Promise<number> {
    const bookingRepository = this.dataSource.getRepository(Booking);
    return bookingRepository.count({ where: { userId } });
  }
}