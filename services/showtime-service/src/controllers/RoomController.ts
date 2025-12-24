import { Router } from "express";
import type { Request, Response } from "express";
import type { RoomRequest } from "../dto/request/RoomRequest.js";
import type { RoomResponse } from "../dto/response/RoomResponse.js";
import { RoomService } from "../services/RoomService.js";
import { requireManagerOrAdmin } from "../middleware/authChecker.js";
import type { RequestWithUserContext } from "../types/userContext.js";
import { AppDataSource } from "../data-source.js";

const router = Router();
const roomService = new RoomService(AppDataSource);

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Room management
 */

/**
 * @swagger
 * /api/showtimes/rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoomRequest'
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomResponse'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Theater not found
 *       500:
 *         description: Internal server error
 */

// POST /api/showtimes/rooms
router.post("/", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const request: RoomRequest = req.body;
  const response: RoomResponse = await roomService.createRoom(request);
  return res.status(201).json(response);
});

/**
 * @swagger
 * /api/showtimes/rooms/{id}:
 *   get:
 *     summary: Get a room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Room details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomResponse'
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 */

// GET /api/showtimes/rooms/:id
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  const response: RoomResponse = await roomService.getRoomById(id);
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of all rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoomResponse'
 *       500:
 *         description: Internal server error
 */
// GET /api/showtimes/rooms
router.get("/", async (_req: Request, res: Response) => {
  const responseList: RoomResponse[] = await roomService.getAllRooms();
  return res.json(responseList);
});
/**
 * @swagger
 * /api/showtimes/rooms/by-theater/{theaterId}:
 *   get:
 *     summary: Get all rooms by theater ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Theater ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: List of rooms in the theater
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoomResponse'
 *       404:
 *         description: Theater not found
 *       500:
 *         description: Internal server error
 */

// GET /api/showtimes/rooms/by-theater/:theaterId
router.get("/by-theater/:theaterId", async (req: Request, res: Response) => {
  const { theaterId } = req.params;
  if (!theaterId) {
    return res.status(400).json({ error: "theaterId is required" });
  }
  const responseList: RoomResponse[] = await roomService.getRoomsByTheaterId(theaterId);
  return res.json(responseList);
});
/**
 * @swagger
 * /api/showtimes/rooms/{id}:
 *   put:
 *     summary: Update a room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoomRequest'
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomResponse'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 */
// PUT /api/showtimes/rooms/:id
router.put("/:id", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  const request: RoomRequest = req.body;
  const response: RoomResponse = await roomService.updateRoom(id, request);
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/rooms/{id}:
 *   delete:
 *     summary: Delete a room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Room deleted successfully"
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 */
// DELETE /api/showtimes/rooms/:id
router.delete("/:id", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  await roomService.deleteRoom(id);
  return res.status(204).send();
});

export default router;
