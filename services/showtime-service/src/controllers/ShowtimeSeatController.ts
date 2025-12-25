import { Router } from "express";
import type { Request, Response } from "express";
import type { UpdateSeatStatusRequest } from "../dto/request/UpdateSeatStatusRequest.js";
import type { BatchInitializeSeatsRequest } from "../dto/request/BatchInitializeSeatsRequest.js";
import type { ShowtimeSeatResponse } from "../dto/response/ShowtimeSeatResponse.js";
import type { ShowtimeSeatsLayoutResponse } from "../dto/response/ShowtimeSeatsLayoutResponse.js";
import { ShowtimeSeatService } from "../services/ShowtimeSeatService.js";
import { requireManagerOrAdmin } from "../middleware/authChecker.js";
import { requireInternal } from "../middleware/internalAuthChecker.js";
import type { RequestWithUserContext } from "../types/userContext.js";
import { AppDataSource } from "../data-source.js";
import { seatLockWebSocketHandler } from "../shared/instances.js";
const router = Router();
const showtimeSeatService = new ShowtimeSeatService(AppDataSource);
/**
 * @swagger
 * tags:
 *   name: Showtime Seats
 *   description: Showtime seat management endpoints
 */

/**
 * @swagger
 * /api/showtimes/showtimeseats/{showtimeId}/seats:
 *   get:
 *     summary: Get all seats for a showtime with their status
 *     tags: [Showtime Seats]
 *     parameters:
 *       - in: path
 *         name: showtimeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Showtime ID
 *     responses:
 *       200:
 *         description: Seat layout with status for the showtime
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShowtimeSeatsLayoutResponse'
 *       400:
 *         description: Missing showtimeId parameter
 *       404:
 *         description: Showtime not found
 *       500:
 *         description: Internal server error
 */
// GET /api/showtimes/showtimeseats/:showtimeId/seats
router.get("/:showtimeId/seats", async (req: Request, res: Response) => {
  const showtimeId = req.params.showtimeId;
  if (!showtimeId) {
    return res.status(400).json({ error: "Missing showtimeId parameter" });
  }
  const response: ShowtimeSeatsLayoutResponse = await showtimeSeatService.getSeatsByShowtime(showtimeId);
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/showtimeseats/{showtimeId}/seats/{seatId}/status:
 *   patch:
 *     summary: Update the status of a seat in a showtime
 *     tags: [ShowtimeSeats]
 *     parameters:
 *       - in: path
 *         name: showtimeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *       - in: path
 *         name: seatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seat ID
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
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "LOCKED"
 *               lockedBy:
 *                 type: string
 *                 example: "user-uuid"
 *     responses:
 *       200:
 *         description: Seat status updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized (missing or invalid internal key)
 *       404:
 *         description: Seat or showtime not found
 */
// PATCH /api/showtimes/showtimeseats/:showtimeId/seats/:seatId/status
router.patch("/:showtimeId/seats/:seatId/status", requireInternal, async (req: Request, res: Response) => {
  const showtimeId = req.params.showtimeId;
  const seatId = req.params.seatId;
  
  const request: UpdateSeatStatusRequest = {
    ...req.body,
    showtimeId,
    seatId,
  };

  const response: ShowtimeSeatResponse = await showtimeSeatService.updateSeatStatus(request);

  // Push WebSocket update
  seatLockWebSocketHandler.broadcastToShowtime(showtimeId!, response);

  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/showtimeseats/initialize-seats:
 *   post:
 *     summary: Batch initialize seats for multiple showtimes
 *     tags: [ShowtimeSeats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               showtimeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["showtime-uuid-1", "showtime-uuid-2"]
 *     responses:
 *       200:
 *         description: Seats initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Seats initialized successfully for 2 showtimes"
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden (requires manager or admin role)
 */
// POST /api/showtimes/showtimeseats/initialize-seats
router.post("/initialize-seats", async (req: RequestWithUserContext, res: Response) => {
  //requireManagerOrAdmin(req.userContext);
  const request: BatchInitializeSeatsRequest = req.body;
  const count = await showtimeSeatService.batchInitializeSeats(request.showtimeIds);
  return res.json({ message: `Seats initialized successfully for ${count} showtimes` });
});
/**
 * @swagger
 * /api/showtimes/showtimeseats/initialize-seats/range:
 *   post:
 *     summary: Initialize seats for showtimes within a date range
 *     tags: [ShowtimeSeats]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Seats initialized successfully for showtimes in the given range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Initialized seats for 5 showtimes from 2025-01-01 to 2025-01-31"
 *       400:
 *         description: Missing or invalid startDate/endDate
 *       403:
 *         description: Forbidden (requires manager or admin role)
 */
// POST /api/showtimes/showtimeseats/initialize-seats/range?startDate=...&endDate=...
router.post("/initialize-seats/range", async (req: RequestWithUserContext, res: Response) => {
  //requireManagerOrAdmin(req.userContext);
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Missing startDate or endDate" });
  }

  const count = await showtimeSeatService.initializeSeatsByDateRange(
    new Date(startDate as string),
    new Date(endDate as string)
  );

  return res.json({
    message: `Initialized seats for ${count} showtimes from ${startDate} to ${endDate}`,
  });
});

export default router;
