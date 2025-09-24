import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);
//router.get("/me", authMiddleware, AuthController.me);

export default router;
