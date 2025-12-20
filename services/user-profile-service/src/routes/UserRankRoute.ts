// import { Router, Request, Response } from "express";
// import { UserRankController } from "../controllers/UserRankController";
// import { UserRankService } from "../services/UserRankService";
// import { UserRankRepository } from "../repositories/UserRankRepository";
// import { AppDataSource } from "../config/Database";

// const router = Router();
// const UserRankRepo = new UserRankRepository(AppDataSource);
// const rankService = new UserRankService(UserRankRepo);
// const controller = new UserRankController(rankService);

// router.post("/", (req: Request, res: Response) =>
//   controller.createRank(req, res)
// );
// router.get("/", (req: Request, res: Response) =>
//   controller.getAllRanks(req, res)
// );
// router.get("/:rankId", (req: Request, res: Response) =>
//   controller.getRankById(req, res)
// );
// router.delete("/:rankId", (req: Request, res: Response) =>
//   controller.deleteRank(req, res)
// );

// export default router;
