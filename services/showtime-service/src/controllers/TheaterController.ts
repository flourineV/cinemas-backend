import { Router } from "express";
import type { Request, Response } from "express";
import type { TheaterRequest } from "../dto/request/TheaterRequest.js";
import type { TheaterResponse } from "../dto/response/TheaterResponse.js";
import type { MovieShowtimesResponse } from "../dto/response/MovieShowtimesResponse.js";
import { TheaterService } from "../services/TheaterService.js";
import { requireManagerOrAdmin } from "../middleware/authChecker.js";
import type { RequestWithUserContext } from '../types/userContext.js';
import { AppDataSource } from "../data-source.js";
import { ShowtimeService } from "../services/ShowtimeService.js";
import { MovieServiceClient } from "../client/MovieServiceClient.js";
import { ShowtimeMapper } from "../mappers/ShowtimeMapper.js";
import { ShowtimeGenerationHelper } from "../helper/ShowtimeGenerationHelper.js";
import { showtimeAutoGenerateConfig } from "../config/showtimeAutoGenerateConfig.js";

const router = Router();
const movieServiceClient = new MovieServiceClient();
const showtimeMapper = new ShowtimeMapper(AppDataSource, movieServiceClient);
const generationHelper = new ShowtimeGenerationHelper(AppDataSource, movieServiceClient, showtimeAutoGenerateConfig);
const showtimeService = new ShowtimeService(AppDataSource, movieServiceClient, showtimeMapper, generationHelper);
const theaterService = new TheaterService(AppDataSource, showtimeService);
/**
 * @swagger
 * tags:
 *   name: Theaters
 *   description: Theater management and showtime queries
 */
/**
 * @swagger
 * /api/showtimes/theaters:
 *   post:
 *     summary: Create a new theater
 *     tags: [Theaters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TheaterRequest'
 *     responses:
 *       201:
 *         description: Theater created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TheaterResponse'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden (requires manager or admin role)
 */
// POST /api/showtimes/theaters
router.post("/", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const request: TheaterRequest = req.body;
  const response: TheaterResponse = await theaterService.createTheater(request);
  return res.status(201).json(response);
});
/**
 * @swagger
 * /api/showtimes/theaters/{id}:
 *   get:
 *     summary: Get a theater by ID
 *     tags: [Theaters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
 *     responses:
 *       200:
 *         description: Theater details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TheaterResponse'
 *       400:
 *         description: id is required
 *       404:
 *         description: Theater not found
 */
// GET /api/showtimes/theaters/:id
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  const response: TheaterResponse = await theaterService.getTheaterById(id);
    return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/theaters:
 *   get:
 *     summary: Get all theaters
 *     tags: [Theaters]
 *     responses:
 *       200:
 *         description: List of theaters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TheaterResponse'
 */
// GET /api/showtimes/theaters
router.get("/", async (_req: Request, res: Response) => {
  const responseList: TheaterResponse[] = await theaterService.getAllTheaters();
  return res.json(responseList);
});
/**
 * @swagger
 * /api/showtimes/theaters/search:
 *   get:
 *     summary: Get theaters by province ID
 *     tags: [Theaters]
 *     parameters:
 *       - in: query
 *         name: provinceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Province ID
 *     responses:
 *       200:
 *         description: List of theaters in the province
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TheaterResponse'
 */
// GET /api/showtimes/theaters/search?provinceId=...
router.get("/search", async (req: Request, res: Response) => {
  const responseList: TheaterResponse[] = await theaterService.getTheatersByProvince(req.query.provinceId as string);
  return res.json(responseList);
});
/**
 * @swagger
 * /api/showtimes/theaters/{id}:
 *   put:
 *     summary: Update a theater by ID
 *     tags: [Theaters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TheaterRequest'
 *     responses:
 *       200:
 *         description: Theater updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TheaterResponse'
 *       400:
 *         description: id is required or invalid input
 *       403:
 *         description: Forbidden (requires manager or admin role)
 *       404:
 *         description: Theater not found
 */
// PUT /api/showtimes/theaters/:id
router.put("/:id", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const request: TheaterRequest = req.body;
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  const response: TheaterResponse = await theaterService.updateTheater(id, request);
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/theaters/{id}:
 *   delete:
 *     summary: Delete a theater by ID
 *     tags: [Theaters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
 *     responses:
 *       204:
 *         description: Theater deleted successfully
 *       400:
 *         description: id is required
 *       403:
 *         description: Forbidden (requires manager or admin role)
 *       404:
 *         description: Theater not found
 */
// DELETE /api/showtimes/theaters/:id
router.delete("/:id", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  await theaterService.deleteTheater(id);
  return res.status(204).send();
});
/**
 * @swagger
 * /api/showtimes/theaters/search-by-name:
 *   get:
 *     summary: Search theaters by name keyword
 *     tags: [Theaters]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Keyword to search by theater name
 *     responses:
 *       200:
 *         description: List of theaters matching the keyword
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TheaterResponse'
 */
// GET /api/showtimes/theaters/search-by-name?keyword=...
router.get("/search-by-name", async (req: Request, res: Response) => {
  const responseList: TheaterResponse[] = await theaterService.searchByName(req.query.keyword as string);
  return res.json(responseList);
});
/**
 * @swagger
 * /api/showtimes/theaters/{theaterId}/movies:
 *   get:
 *     summary: Get movies and showtimes for a theater
 *     tags: [Theaters]
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
 *     responses:
 *       200:
 *         description: List of movies with showtimes for the theater
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MovieShowtimesResponse'
 *       400:
 *         description: theaterId is required
 *       404:
 *         description: Theater not found
 */
// GET /api/showtimes/theaters/:theaterId/movies
router.get("/:theaterId/movies", async (req: Request, res: Response) => {
  const { theaterId } = req.params;
  if (!theaterId) {
    return res.status(400).json({ error: "id is required" });
  }
  const response: MovieShowtimesResponse[] = await theaterService.getMoviesByTheater(theaterId);
  return res.json(response);
});

export default router;
