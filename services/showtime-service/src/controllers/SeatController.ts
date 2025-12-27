import { Router } from "express";
import type { Request, Response } from "express";
import { SeatService } from "../services/SeatService.js";
import { requireManagerOrAdmin } from "../middleware/authChecker.js";
import type { RequestWithUserContext } from "../types/userContext.js";
import { AppDataSource } from "../data-source.js";
import type { SeatRequest } from "../dto/request/SeatRequest.js";
import type { SeatResponse } from "../dto/response/SeatResponse.js";

const router = Router();
const seatService = new SeatService(AppDataSource);
/**
 * @swagger
 * tags:
 *   name: Seats
 *   description: Seat management endpoints
 */
/**
 * @swagger
 * /api/showtimes/seats:
 *   post:
 *     summary: Create multiple seats
 *     tags: [Seats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/SeatRequest'
 *     responses:
 *       201:
 *         description: Seats created successfully
 *       403:
 *         description: Forbidden (requires manager or admin role)
 */
router.post("/", async (req: RequestWithUserContext, res: Response) => {
  //requireManagerOrAdmin(req.userContext);
  const requests: SeatRequest[] = req.body;
  const responses: SeatResponse[] = await seatService.createSeats(requests);
  return res.status(201).json(responses);
});
/**
 * @swagger
 * /api/showtimes/seats:
 *   get:
 *     summary: Get all seats
 *     tags: [Seats]
 *     responses:
 *       200:
 *         description: List of all seats
 */
router.get("/", async (req: Request, res: Response) => {
  const responses: SeatResponse[] = await seatService.getAllSeats();
  return res.json(responses);
});
/**
 * @swagger
 * /api/showtimes/seats/{id}:
 *   get:
 *     summary: Get seat by ID
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Seat details
 *       404:
 *         description: Seat not found
 */
router.get("/:id", async (req: Request, res: Response) => {
    const id = req.params.id;
    if(!id){
        return res.status(400).json({ error: "Missing id parameter" });
    }
    const response: SeatResponse = await seatService.getSeatById(id);
    return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/seats/room/{roomId}:
 *   get:
 *     summary: Get seats by room ID
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of seats in the room
 */
router.get("/room/:roomId", async (req: Request, res: Response) => {
    const roomId = req.params.roomId;
    if(!roomId){
        return res.status(400).json({ error: "Missing room id parameter" });
    }
    const responses: SeatResponse[] = await seatService.getSeatsByRoomId(roomId);
    return res.json(responses);
});

/**
 * @swagger
 * /api/showtimes/seats/{id}:
 *   put:
 *     summary: Update seat
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeatRequest'
 *     responses:
 *       200:
 *         description: Seat updated successfully
 *       403:
 *         description: Forbidden (requires manager or admin role)
 *       404:
 *         description: Seat not found
 */
router.put("/:id", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const id = req.params.id;
    if(!id){
        return res.status(400).json({ error: "Missing id parameter" });
    }
  const request: SeatRequest = req.body;
  const response: SeatResponse = await seatService.updateSeat(id, request);
  return res.json(response);
});

/**
 * @swagger
 * /api/showtimes/seats/{id}:
 *   delete:
 *     summary: Delete seat
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Seat deleted successfully
 *       403:
 *         description: Forbidden (requires manager or admin role)
 *       404:
 *         description: Seat not found
 */
router.delete("/:id", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const id = req.params.id;
    if(!id){
        return res.status(400).json({ error: "Missing id parameter" });
    }
  await seatService.deleteSeat(id);
  return res.status(204).send();
});

export default router;