import { Router } from "express";
import { UserRankController } from "../controllers/UserRankController";
import { UserRankService } from "../services/UserRankService";
import { UserRankRepository } from "../repositories/UserRankRepository";
import { AppDataSource } from "../config/database";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";

// Khởi tạo service và controller
const rankService = new UserRankService(new UserRankRepository(AppDataSource));
const rankController = new UserRankController(rankService);

const router = Router();

router.post("/", JwtMiddleware(process.env.APP_JWT_SECRET!), (req, res) =>
  rankController.createRank(req, res)
);
router.get("/", (req, res) => rankController.getAllRanks(req, res));
router.get("/:rankId", (req, res) => rankController.getRankById(req, res));
router.delete(
  "/:rankId",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  (req, res) => rankController.deleteRank(req, res)
);

export default router;
