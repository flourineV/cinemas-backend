import { Router } from "express";
import type { Request, Response } from "express";
import { ShowtimeStatsService } from "../services/ShowtimeStatsService.js";
import { requireManagerOrAdmin, isManager } from "../middleware/authChecker.js";
import type { ShowtimeStatsResponse } from "../dto/response/ShowtimeStatsResponse.js";
import type { RequestWithUserContext } from "../types/userContext.js";
import { AppDataSource } from "../data-source.js";

const router = Router();
const showtimeStatsService = new ShowtimeStatsService(AppDataSource);

/**
 * @swagger
 * tags:
 *   name: ShowtimeStats
 *   description: Statistics and reporting for showtimes
 */

/**
 * @swagger
 * /api/showtimes/stats/overview:
 *   get:
 *     summary: Get overview statistics for showtimes
 *     tags: [ShowtimeStats]
 *     parameters:
 *       - in: query
 *         name: theaterId
 *         schema:
 *           type: string
 *         description: Optional theater ID. Required if the user is a manager.
 *     responses:
 *       200:
 *         description: Overview statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalShowtimes:
 *                   type: integer
 *                   example: 120
 *                 totalSeats:
 *                   type: integer
 *                   example: 6000
 *                 occupiedSeats:
 *                   type: integer
 *                   example: 4500
 *                 occupancyRate:
 *                   type: number
 *                   format: float
 *                   example: 0.75
 *       400:
 *         description: Manager must provide theaterId parameter
 *       403:
 *         description: Forbidden (requires manager or admin role)
 */
// GET /api/showtimes/stats/overview
router.get("/overview", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);

  const theaterId = req.query.theaterId as string | undefined;

  if (isManager(req.userContext) && !theaterId) {
    return res.status(400).json({
      error: "Manager must provide theaterId parameter",
    });
  }

  const response: ShowtimeStatsResponse = await showtimeStatsService.getOverview(theaterId);
  return res.json(response);
});

export default router;
