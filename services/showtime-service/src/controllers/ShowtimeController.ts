import { Router } from "express";
import type { Request, Response } from "express";
import type { ShowtimeRequest } from "../dto/request/ShowtimeRequest.js";
import type { BatchShowtimeRequest } from "../dto/request/BatchShowtimeRequest.js";
import type { ValidateShowtimeRequest } from "../dto/request/ValidateShowtimeRequest.js";
import type { ShowtimeResponse } from "../dto/response/ShowtimeResponse.js";
import type { BatchShowtimeResponse } from "../dto/response/BatchShowtimeResponse.js";
import type { ShowtimesByMovieResponse } from "../dto/response/ShowtimesByMovieResponse.js";
import type { ShowtimeDetailResponse } from "../dto/response/ShowtimeDetailResponse.js";
import type { ShowtimeConflictResponse } from "../dto/response/ShowtimeConflictResponse.js";
import type { AutoGenerateShowtimesResponse } from "../dto/response/AutoGenerateShowtimesResponse.js";
import type { TheaterShowtimesResponse } from "../dto/response/TheaterShowtimesResponse.js";
import type { MovieWithTheatersResponse } from "../dto/response/MovieWithTheatersResponse.js";
import type { PagedResponse } from "../dto/response/PagedResponse.js";
import { ShowtimeService } from "../services/ShowtimeService.js";
import { requireManagerOrAdmin } from "../middleware/authChecker.js";
import type { RequestWithUserContext } from "../types/userContext.js";
import { AppDataSource } from "../data-source.js";
import { movieServiceClient } from "../client/MovieServiceClient.js";
import { ShowtimeGenerationHelper } from "../helper/ShowtimeGenerationHelper.js";
import { ShowtimeMapper } from "../mappers/ShowtimeMapper.js";
import { showtimeAutoGenerateConfig } from "../config/showtimeAutoGenerateConfig.js";

const router = Router();
const showtimeMapper = new ShowtimeMapper(AppDataSource, movieServiceClient);
const generationHelper = new ShowtimeGenerationHelper(AppDataSource, movieServiceClient, showtimeAutoGenerateConfig);

const showtimeService = new ShowtimeService(
  AppDataSource,
  movieServiceClient,
  showtimeMapper,
  generationHelper
);
/**
 * @swagger
 * tags:
 *   name: Showtimes
 *   description: Showtime management endpoints
 */

/**
 * @swagger
 * /api/showtimes/{id}:
 *   get:
 *     summary: Get showtime by ID
 *     tags: [Showtimes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Showtime ID
 *     responses:
 *       200:
 *         description: Showtime details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShowtimeResponse'
 *       400:
 *         description: Missing showtime ID
 *       404:
 *         description: Showtime not found
 *       500:
 *         description: Internal server error
 */

// GET /api/showtimes/:id
router.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ message: "Showtime ID is required" });
  }
  const response: ShowtimeResponse = await showtimeService.getShowtimeById(id);
  return res.json(response);
});

/**
 * @swagger
 * /api/showtimes:
 *   post:
 *     summary: Create a new showtime (Manager/Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShowtimeRequest'
 *     responses:
 *       201:
 *         description: Showtime created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShowtimeResponse'
 *       400:
 *         description: Invalid input or time conflict
 *       401:
 *         description: Unauthorized - Manager/Admin access required
 *       404:
 *         description: Theater or Room not found
 *       500:
 *         description: Internal server error
 */

// POST /api/showtimes
router.post("/", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const request: ShowtimeRequest = req.body;
  const response: ShowtimeResponse = await showtimeService.createShowtime(request);
  return res.status(201).json(response);
});

/**
 * @swagger
 * /api/showtimes/batch:
 *   post:
 *     summary: Create multiple showtimes in batch (Manager/Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchShowtimeRequest'
 *     responses:
 *       201:
 *         description: Batch creation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BatchShowtimeResponse'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Manager/Admin access required
 *       500:
 *         description: Internal server error
 */
// POST /api/showtimes/batch
router.post("/batch", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const request: BatchShowtimeRequest = req.body;
  const response: BatchShowtimeResponse = await showtimeService.createShowtimesBatch(request);
  return res.status(201).json(response);
});
/**
 * @swagger
 * /api/showtimes:
 *   get:
 *     summary: Get all showtimes
 *     tags: [Showtimes]
 *     responses:
 *       200:
 *         description: List of all showtimes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShowtimeResponse'
 *       500:
 *         description: Internal server error
 */
// GET /api/showtimes
router.get("/", async (_req: Request, res: Response) => {
  const response: ShowtimeResponse[] = await showtimeService.getAllShowtimes();
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/by-movie/{movieId}:
 *   get:
 *     summary: Get showtimes by movie ID (grouped by date and theater)
 *     tags: [Showtimes]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Showtimes grouped by date and theater for the next 5 days
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShowtimesByMovieResponse'
 *       400:
 *         description: Missing movie ID
 *       500:
 *         description: Internal server error
 */
// GET /api/showtimes/by-movie/:movieId
router.get("/by-movie/:movieId", async (req: Request, res: Response) => {
  const movieId = req.params.movieId;
  if (!movieId) {
    return res.status(400).json({ message: "Movie ID is required" });
  }
  const response: ShowtimesByMovieResponse = await showtimeService.getShowtimesByMovieGrouped(movieId);
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/by-theater:
 *   get:
 *     summary: Get showtimes by theater and date range
 *     tags: [Showtimes]
 *     parameters:
 *       - in: query
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Theater ID
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date and time
 *         example: "2024-12-25T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date and time
 *         example: "2024-12-25T23:59:59Z"
 *     responses:
 *       200:
 *         description: List of showtimes in the date range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShowtimeResponse'
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error
 */

// GET /api/showtimes/by-theater?theaterId=...&startDate=...&endDate=...
router.get("/by-theater", async (req: Request, res: Response) => {
  const { theaterId, startDate, endDate } = req.query;
  const response: ShowtimeResponse[] = await showtimeService.getShowtimesByTheaterAndDate(
    theaterId as string,
    new Date(startDate as string),
    new Date(endDate as string)
  );
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/{id}:
 *   put:
 *     summary: Update a showtime by ID (Manager/Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Showtime ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShowtimeRequest'
 *     responses:
 *       200:
 *         description: Showtime updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShowtimeResponse'
 *       400:
 *         description: Invalid input or time conflict
 *       401:
 *         description: Unauthorized - Manager/Admin access required
 *       404:
 *         description: Showtime not found
 *       500:
 *         description: Internal server error
 */
// PUT /api/showtimes/:id
router.put("/:id", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ message: "Showtime ID is required" });
  }
  const request: ShowtimeRequest = req.body;
  const response: ShowtimeResponse = await showtimeService.updateShowtime(id, request);
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/{id}:
 *   delete:
 *     summary: Delete a showtime by ID (Manager/Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Showtime ID
 *     responses:
 *       204:
 *         description: Showtime deleted successfully
 *       400:
 *         description: Missing showtime ID
 *       401:
 *         description: Unauthorized - Manager/Admin access required
 *       404:
 *         description: Showtime not found
 *       500:
 *         description: Internal server error
 */
// DELETE /api/showtimes/:id
router.delete("/:id", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  await showtimeService.deleteShowtime(id);
  return res.status(204).send();
});
/**
 * @swagger
 * /api/showtimes/admin/search:
 *   get:
 *     summary: Search showtimes with advanced filters and pagination (Manager/Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: provinceId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by province ID
 *       - in: query
 *         name: theaterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by theater ID
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by room ID
 *       - in: query
 *         name: movieId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by movie ID
 *       - in: query
 *         name: showtimeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by showtime ID
 *       - in: query
 *         name: startOfDay
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of day filter
 *       - in: query
 *         name: endOfDay
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of day filter
 *       - in: query
 *         name: fromTime
 *         schema:
 *           type: string
 *           format: time
 *         description: Time range start (HH:mm format)
 *         example: "18:00"
 *       - in: query
 *         name: toTime
 *         schema:
 *           type: string
 *           format: time
 *         description: Time range end (HH:mm format)
 *         example: "23:00"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Page size
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "startTime"
 *         description: Field to sort by
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "asc"
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Paginated list of showtimes with details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PagedShowtimeResponse'
 *       401:
 *         description: Unauthorized - Manager/Admin access required
 *       500:
 *         description: Internal server error
 */
// GET /api/showtimes/admin/search
router.get("/admin/search", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
   try {
    // Parse query parameters from req.query
    const provinceId = req.query.provinceId as string | undefined;
    const theaterId = req.query.theaterId as string | undefined;
    const roomId = req.query.roomId as string | undefined;
    const movieId = req.query.movieId as string | undefined;
    const showtimeId = req.query.showtimeId as string | undefined;

    // Parse dates
    const startOfDay = req.query.startOfDay ? new Date(req.query.startOfDay as string) : undefined;
    const endOfDay = req.query.endOfDay ? new Date(req.query.endOfDay as string) : undefined;

    // Parse times
    const fromTime = req.query.fromTime as string | undefined;
    const toTime = req.query.toTime as string | undefined;

    // Pagination
    const page = req.query.page ? Number(req.query.page) : 1;
    const size = req.query.size ? Number(req.query.size) : 10;

    // Sorting
    const sortBy = req.query.sortBy as string | undefined;
    const sortType = (req.query.sortType as 'asc' | 'desc') || 'asc';

    // Call service
    const response = await showtimeService.getAllAvailableShowtimes(provinceId, theaterId,
      roomId, movieId,showtimeId,startOfDay, endOfDay, fromTime, toTime, page, size, sortBy, sortType
    );

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});
/**
 * @swagger
 * /api/showtimes/validate:
 *   post:
 *     summary: Validate showtime for conflicts (Manager/Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateShowtimeRequest'
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShowtimeConflictResponse'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Manager/Admin access required
 *       500:
 *         description: Internal server error
 */

// POST /api/showtimes/validate
router.post("/validate", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const request: ValidateShowtimeRequest = req.body;
  const response: ShowtimeConflictResponse = await showtimeService.validateShowtime(request);
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/by-room:
 *   get:
 *     summary: Get showtimes by room and date range (Manager/Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room ID
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date and time
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date and time
 *     responses:
 *       200:
 *         description: List of showtimes for the room
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShowtimeResponse'
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized - Manager/Admin access required
 *       500:
 *         description: Internal server error
 */
// GET /api/showtimes/by-room?roomId=...&start=...&end=...
router.get("/by-room", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const { roomId, start, end } = req.query;
  const response: ShowtimeResponse[] = await showtimeService.getShowtimesByRoomAndDateRange(
    roomId as string,
    new Date(start as string),
    new Date(end as string)
  );
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/auto-generate:
 *   post:
 *     summary: Auto-generate showtimes for a date range (Manager/Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-12-25"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-12-31"
 *     responses:
 *       201:
 *         description: Auto-generation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AutoGenerateShowtimesResponse'
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Unauthorized - Manager/Admin access required
 *       500:
 *         description: Internal server error
 */
// POST /api/showtimes/auto-generate?startDate=...&endDate=...
router.post("/auto-generate", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const { startDate, endDate } = req.query;
  const response: AutoGenerateShowtimesResponse = await showtimeService.autoGenerateShowtimes(
    new Date(startDate as string),
    new Date(endDate as string)
  );
  return res.status(201).json(response);
});
/**
 * @swagger
 * /api/showtimes/by-movie-and-province:
 *   get:
 *     summary: Get theater showtimes by movie and province
 *     tags: [Showtimes]
 *     parameters:
 *       - in: query
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Movie ID
 *       - in: query
 *         name: provinceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Province ID
 *     responses:
 *       200:
 *         description: List of theaters with showtimes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TheaterShowtimesResponse'
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error
 */

// GET /api/showtimes/by-movie-and-province?movieId=...&provinceId=...
router.get("/by-movie-and-province", async (req: Request, res: Response) => {
  const { movieId, provinceId } = req.query;
  const response: TheaterShowtimesResponse[] = await showtimeService.getTheaterShowtimesByMovieAndProvince(
    movieId as string,
    provinceId as string
  );
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/movies-with-theaters:
 *   get:
 *     summary: Get movies with their theaters and showtimes by date
 *     tags: [Showtimes]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date (YYYY-MM-DD)
 *         example: "2024-12-25"
 *       - in: query
 *         name: movieId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional - Filter by movie ID
 *       - in: query
 *         name: theaterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional - Filter by theater ID
 *     responses:
 *       200:
 *         description: List of movies with theaters and showtimes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MovieWithTheatersResponse'
 *       400:
 *         description: Invalid date format
 *       500:
 *         description: Internal server error
 */
// GET /api/showtimes/movies-with-theaters?date=...&movieId=...&theaterId=...
router.get("/movies-with-theaters", async (req: Request, res: Response) => {
  const { date, movieId, theaterId } = req.query;
  const response: MovieWithTheatersResponse[] = await showtimeService.getMoviesWithTheatersByDate(
    new Date(date as string),
    movieId as string | undefined,
    theaterId as string | undefined
  );
  return res.json(response);
});

export default router;
