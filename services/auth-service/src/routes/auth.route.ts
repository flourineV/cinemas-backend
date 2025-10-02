import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/signup", AuthController.register);
router.post("/signin", AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);
router.get("/me", authMiddleware, AuthController.getMe);

export default router;
