import { Router } from "express";
import type { Request, Response } from "express";
import { ShowtimeStatusService } from "../services/ShowtimeStatusService.js";
import { requireManagerOrAdmin } from "../middleware/authChecker.js";
import type { RequestWithUserContext } from "../types/userContext.js";
import { AppDataSource } from "../data-source.js";
import { ShowtimeProducer } from "../producer/ShowtimeProducer.js";
const router = Router();
const showtimeProducer = new ShowtimeProducer();
const showtimeStatusService = new ShowtimeStatusService(AppDataSource, showtimeProducer);
/**
 * @swagger
 * tags:
 *   name: ShowtimeStatus
 *   description: Manage suspension of showtimes
 */
/**
 * @swagger
 * /api/showtimes/suspend-by-movie/{movieId}:
 *   post:
 *     summary: Suspend all showtimes by movie ID
 *     tags: [ShowtimeStatus]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           example: "Movie archived"
 *         description: Reason for suspension
 *     responses:
 *       200:
 *         description: Showtimes suspended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Showtimes suspended successfully"
 *                 movieId:
 *                   type: string
 *                   example: "movie-uuid"
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 reason:
 *                   type: string
 *                   example: "Movie archived"
 *       400:
 *         description: movieId is required
 *       403:
 *         description: Forbidden (requires manager or admin role)
 */
// POST /api/showtimes/suspend-by-movie/:movieId
router.post("/suspend-by-movie/:movieId", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const movieId = req.params.movieId;
  const reason = (req.query.reason as string) || "Movie archived";
  if (!movieId) {
    return res.status(400).json({ error: "movieId is required" });
  }
  const count = await showtimeStatusService.suspendShowtimesByMovie(movieId, reason);

  return res.json({
    message: "Showtimes suspended successfully",
    movieId,
    count,
    reason,
  });
});

/**
 * @swagger
 * /api/showtimes/{showtimeId}/suspend:
 *   post:
 *     summary: Suspend a specific showtime by ID
 *     tags: [ShowtimeStatus]
 *     parameters:
 *       - in: path
 *         name: showtimeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           example: "Suspended by admin"
 *         description: Reason for suspension
 *     responses:
 *       200:
 *         description: Showtime suspended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Showtime suspended successfully"
 *                 showtimeId:
 *                   type: string
 *                   example: "showtime-uuid"
 *                 reason:
 *                   type: string
 *                   example: "Suspended by admin"
 *       400:
 *         description: showtimeId is required
 *       403:
 *         description: Forbidden (requires manager or admin role)
 */
// POST /api/showtimes/:showtimeId/suspend
router.post("/:showtimeId/suspend", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);

  const showtimeId = req.params.showtimeId;
  const reason = (req.query.reason as string) || "Suspended by admin";
  if (!showtimeId) {
    return res.status(400).json({ error: "showtimeId is required" });
  }
  await showtimeStatusService.suspendShowtime(showtimeId, reason);

  return res.json({
    message: "Showtime suspended successfully",
    showtimeId,
    reason,
  });
});

export default router;
