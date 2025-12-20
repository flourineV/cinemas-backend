// import { Router, Request, Response } from "express";
// import { ManagerProfileController } from "../controllers/ManagerProfileController";
// import { ManagerProfileService } from "../services/ManagerProfileService";
// import { ManagerProfileRepository } from "../repositories/ManagerProfileRepository";
// import { AppDataSource } from "../config/Database";
// import { UserProfileRepository } from "../repositories/UserProfileRepository";

// const router = Router();

// const managerRepo = new ManagerProfileRepository(AppDataSource);
// const userProfileRepo = new UserProfileRepository(AppDataSource);
// const managerService = new ManagerProfileService(managerRepo, userProfileRepo);
// const controller = new ManagerProfileController(managerService);

// router.post("/", (req: Request, res: Response) =>
//   controller.createManager(req, res)
// );
// router.get("/user/:userProfileId", (req: Request, res: Response) =>
//   controller.getManagerByUser(req, res)
// );
// router.get("/", (req: Request, res: Response) =>
//   controller.getAllManagers(req, res)
// );
// router.get("/cinema/:cinemaId", (req: Request, res: Response) =>
//   controller.getManagersByCinema(req, res)
// );
// router.delete("/:managerId", (req: Request, res: Response) =>
//   controller.deleteManager(req, res)
// );

// export default router;
