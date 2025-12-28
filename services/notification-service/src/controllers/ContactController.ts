import { Router } from "express";
import type { Request, Response} from "express";
import { EmailService } from "../services/EmailService.js";

const router = Router();
const emailService = new EmailService();
  
// POST /api/notifications/contact/send
router.post("/send", async (req: Request, res: Response) => {
  const { name, email, message } = req.body;

  try {
    await emailService.sendContactEmail(name, email, message);

    return res.json({
      success: true,
      message: "Contact form submitted successfully. We will get back to you soon!",
    });
  } catch (err: any) {
    console.error("Failed to send contact form:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send contact form. Please try again later.",
    });
  }
});

export default router;
