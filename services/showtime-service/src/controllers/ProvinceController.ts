import { Router } from "express";
import type { Request, Response } from "express";
import type { ProvinceRequest } from "../dto/request/ProvinceRequest.js";
import type { ProvinceResponse } from "../dto/response/ProvinceResponse.js";
import { ProvinceService } from "../services/ProvinceService.js";
import { requireAdmin, requireManagerOrAdmin } from "../middleware/authChecker.js";
import type { RequestWithUserContext } from "../types/userContext.js";
import { AppDataSource } from "../data-source.js";

const router = Router();
const provinceService = new ProvinceService(AppDataSource);

/**
 * @swagger
 * tags:
 *   name: Provinces
 *   description: Province management
 */

/**
 * @swagger
 * /api/showtimes/provinces:
 *   post:
 *     summary: Create a new province
 *     tags: [Provinces]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProvinceRequest'
 *     responses:
 *       201:
 *         description: Province created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProvinceResponse'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
// POST /api/showtimes/provinces
router.post("/", async (req: RequestWithUserContext, res: Response) => {
  requireAdmin(req.userContext); // middleware check quyền
  const request: ProvinceRequest = req.body;
  const response: ProvinceResponse = await provinceService.createProvince(request);
  return res.status(201).json(response);
});

/**
 * @swagger
 * /api/showtimes/provinces/{id}:
 *   get:
 *     summary: Get a province by ID
 *     tags: [Provinces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Province ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Province details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProvinceResponse'
 *       404:
 *         description: Province not found
 *       500:
 *         description: Internal server error
 */

// GET /api/showtimes/provinces/:id
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  const response: ProvinceResponse = await provinceService.getProvinceById(id);
  return res.json(response);
});

/**
 * @swagger
 * /api/showtimes/provinces:
 *   get:
 *     summary: Get all provinces
 *     tags: [Provinces]
 *     responses:
 *       200:
 *         description: List of all provinces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProvinceResponse'
 *       500:
 *         description: Internal server error
 */

// GET /api/showtimes/provinces
router.get("/", async (_req: Request, res: Response) => {
  const response: ProvinceResponse[] = await provinceService.getAllProvinces();
  return res.json(response);
});

/**
 * @swagger
 * /api/showtimes/provinces/{id}:
 *   put:
 *     summary: Update a province by ID
 *     tags: [Provinces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Province ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProvinceRequest'
 *     responses:
 *       200:
 *         description: Province updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProvinceResponse'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Province not found
 *       500:
 *         description: Internal server error
 */

// PUT /api/showtimes/provinces/:id
router.put("/:id", async (req: RequestWithUserContext, res: Response) => {
  requireAdmin(req.userContext);
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  const request: ProvinceRequest = req.body;
  const response: ProvinceResponse = await provinceService.updateProvince(id, request);
  return res.json(response);
});
/**
 * @swagger
 * /api/showtimes/provinces/{id}:
 *   delete:
 *     summary: Delete a province by ID
 *     tags: [Provinces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Province ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Province deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Province deleted successfully"
 *       404:
 *         description: Province not found
 *       500:
 *         description: Internal server error
 */

// DELETE /api/showtimes/provinces/:id
router.delete("/:id", async (req: RequestWithUserContext, res: Response) => {
  requireManagerOrAdmin(req.userContext);
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  await provinceService.deleteProvince(id);
  return res.status(204).send();
});

export default router;
