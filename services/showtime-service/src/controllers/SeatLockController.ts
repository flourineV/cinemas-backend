import { Router } from "express";
import type { Request, Response } from "express";
import { SeatLockService } from "../services/SeatLockService.js";
import { requireManagerOrAdmin } from "../middleware/authChecker.js";
import { requireInternal } from "../middleware/internalAuthChecker.js";
import type { RequestWithUserContext } from "../types/userContext.js";
import { AppDataSource } from "../data-source.js";
import type { SingleSeatLockRequest } from "../dto/request/SingleSeatLockRequest.js";
import type { SeatLockRequest } from "../dto/request/SeatLockRequest.js";
import type { SeatReleaseRequest } from "../dto/request/SeatReleaseRequest.js";
import type { ExtendLockRequest } from "../dto/request/ExtendLockRequest.js";
import type { SeatLockResponse } from "../dto/response/SeatLockResponse.js";
import { requireInternalOrManager } from "../middleware/internalOrAdminChecker.js";

import { redisClient, showtimeProducer, seatLockWebSocketHandler } from "../shared/instances.js";
const router = Router();
const seatLockService = new SeatLockService(AppDataSource, redisClient, showtimeProducer, seatLockWebSocketHandler);
/**
 * @swagger
 * tags:
 *   name: Seat Lock
 *   description: Seat locking management endpoints
 */
/**
 * @swagger
 * /api/showtimes/seat-lock/lock-single:
 *   post:
 *     summary: Lock a single seat
 *     tags: [Seat Lock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SingleSeatLockRequest'
 *     responses:
 *       200:
 *         description: Seat locked successfully
 */
router.post("/lock-single", async (req: Request, res: Response) => {
  const request: SingleSeatLockRequest = req.body;
  console.log(`API: Locking single seat ${request.selectedSeat.seatId} for showtime ${request.showtimeId}`);
  const response: SeatLockResponse = await seatLockService.lockSingleSeat(request);
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/seat-lock/unlock-single:
 *   post:
 *     summary: Unlock a single seat
 *     tags: [Seat Lock]
 *     parameters:
 *       - in: query
 *         name: showtimeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: seatId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *       
 *     responses:
 *       200:
 *         description: Seat unlocked successfully
 */
// //- in: query
//          name: guestSessionId
//           schema:
//            type: string
//            format: uuid
router.post("/unlock-single", async (req: Request, res: Response) => {
  const { showtimeId, seatId, userId } = req.query; //, guestSessionId
  console.log(`API: Unlocking single seat ${seatId} for showtime ${showtimeId}`);
  
  const response: SeatLockResponse = await seatLockService.unlockSingleSeat(
    showtimeId as string,
    seatId as string,
    userId as string | undefined,
    //guestSessionId as string | undefined
  );
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/seat-lock/unlock-batch:
 *   post:
 *     summary: Unlock multiple seats
 *     tags: [Seat Lock]
 *     parameters:
 *       - in: query
 *         name: showtimeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: seatIds
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Seats unlocked successfully
 */
// - in: query
//          name: guestSessionId
//          schema:
//            type: string
//            format: uuid
router.post("/unlock-batch", async (req: Request, res: Response) => {
  const { showtimeId, seatIds, userId } = req.query; //, guestSessionId
  const seatIdArray = Array.isArray(seatIds) ? seatIds : [seatIds];
  
  console.log(`API: Unlocking ${seatIdArray.length} seats for showtime ${showtimeId}`);
  
  const responses: SeatLockResponse[] = await seatLockService.unlockBatchSeats(
    showtimeId as string,
    seatIdArray as string[],
    userId as string | undefined,
    //guestSessionId as string | undefined
  );
  return res.json(responses);
});

/**
 * @swagger
 * /api/showtimes/seat-lock/lock:
 *   post:
 *     summary: Lock multiple seats
 *     tags: [Seat Lock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeatLockRequest'
 *     responses:
 *       200:
 *         description: Seats locked successfully
 */
router.post("/lock", async (req: Request, res: Response) => {
  const request: SeatLockRequest = req.body;
  console.log(`API: Locking ${request.selectedSeats.length} seats for showtime ${request.showtimeId}`);
  const responses: SeatLockResponse[] = await seatLockService.lockSeats(request);
  return res.json(responses);
});

/**
 * @swagger
 * /api/showtimes/seat-lock/release:
 *   post:
 *     summary: Release seats (manager/admin or internal service)
 *     tags: [Seat Lock]
 *     parameters:
 *       - in: header
 *         name: X-Internal-Secret
 *         schema:
 *           type: string
 *         description: Internal service authentication key (alternative to manager/admin auth)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeatReleaseRequest'
 *     responses:
 *       200:
 *         description: Seats released successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/release", requireInternalOrManager, async (req: RequestWithUserContext, res: Response) => {
    // Allow either internal service call OR manager/admin role

  const request: SeatReleaseRequest = req.body;
  console.log(`API: Releasing ${request.seatIds.length} seats for booking ${request.bookingId} (Reason: ${request.reason})`);
  
  const responses: SeatLockResponse[] = await seatLockService.releaseSeats(
    request.showtimeId,
    request.seatIds,
    request.bookingId??null,
    request.reason
  );
  return res.json(responses);
});

/**
 * @swagger
 * /api/showtimes/seat-lock/status:
 *   get:
 *     summary: Get seat lock status
 *     tags: [Seat Lock]
 *     parameters:
 *       - in: query
 *         name: showtimeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: seatId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Seat lock status
 */
router.get("/status", async (req: Request, res: Response) => {
  const { showtimeId, seatId } = req.query;
  const response: SeatLockResponse = await seatLockService.seatStatus(
    showtimeId as string,
    seatId as string
  );
  return res.json(response);
});

/**
 * @swagger
 * /api/showtimes/seat-lock/extend-for-payment:
 *   post:
 *     summary: Extend seat lock for payment (internal service only)
 *     tags: [Seat Lock]
 *     parameters:
 *       - in: header
 *         name: X-Internal-Secret
 *         required: true
 *         schema:
 *           type: string
 *         description: Internal service authentication key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExtendLockRequest'
 *     responses:
 *       204:
 *         description: Lock extended successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/extend-for-payment", requireInternal, async (req: Request, res: Response) => {
  const request: ExtendLockRequest = req.body;
  console.log(`API: Extending seat lock for payment - showtime ${request.showtimeId}, ${request.seatIds.length} seats`);

  await seatLockService.extendLockForPayment(
    request.showtimeId,
    request.seatIds,
    request.userId,
    //request.guestSessionId
  );

  return res.status(204).send();
});

export default router;