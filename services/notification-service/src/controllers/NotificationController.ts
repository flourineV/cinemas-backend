import { Router } from "express";
import type { Request, Response} from "express";
import { NotificationService } from "../services/NotificationService.js";
import type { PromotionNotificationRequest } from "../dto/request/PromotionNotificationRequest.js";
import type { FnbOrderConfirmationRequest } from "../dto/request/FnbOrderConfirmationRequest.js";
import { AppDataSource } from "../data-source.js";

const router = Router();
const notificationService = new NotificationService(AppDataSource);

// GET /api/notifications/notifications
router.get("/", async (_req: Request, res: Response) => {
  try {
    const notifications = await notificationService.getAll();
    return res.json(notifications);
  } catch (err: any) {
    console.error("Error fetching notifications:", err);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// GET /api/notifications/notifications/user/:userId
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if(!userId){
      return res.status(400).json({ error: "id is required" });
    }
    const notifications = await notificationService.getByUser(userId);
    return res.json(notifications);
  } catch (err: any) {
    console.error("Error fetching notifications by user:", err);
    return res.status(500).json({ message: "Failed to fetch notifications for user" });
  }
});

// POST /api/notifications/notifications/promotion
router.post("/promotion", async (req: Request, res: Response) => {
  try {
    const request: PromotionNotificationRequest = req.body;
    const response = await notificationService.createPromotionNotification(request);
    return res.json(response);
  } catch (err: any) {
    console.error("Error creating promotion notification:", err);
    return res.status(500).json({ message: "Failed to create promotion notification" });
  }
});

// POST /api/notifications/notifications/fnb-order-confirmation
router.post("/fnb-order-confirmation", async (req: Request, res: Response) => {
  try {
    const request: FnbOrderConfirmationRequest = req.body;
    await notificationService.sendFnbOrderConfirmationEmail(request);
    return res.sendStatus(200);
  } catch (err: any) {
    console.error("Error sending FnB order confirmation:", err);
    return res.status(500).json({ message: "Failed to send FnB order confirmation" });
  }
});

export default router;

