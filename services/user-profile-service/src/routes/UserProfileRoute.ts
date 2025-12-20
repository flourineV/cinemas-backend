// import { Router, Request, Response } from "express";
// import { UserProfileController } from "../controllers/UserProfileController";
// import { UserProfileService } from "../services/UserProfileService";
// import { InternalAuthChecker } from "../middlewares/InternalAuthChecker";
// import { UserProfileRepository } from "../repositories/UserProfileRepository";
// import { AppDataSource } from "../config/Database";
// import { UserRankService } from "../services/UserRankService";
// import { UserRankRepository } from "../repositories/UserRankRepository";
// import { CloudinaryService } from "../services/CloudinaryService";

// const router = Router();

// const userProfileRepo = new UserProfileRepository(AppDataSource);
// const rankRepo = new UserRankRepository(AppDataSource);
// const rankService = new UserRankService(rankRepo);
// const cloudinaryService = new CloudinaryService();

// const userProfileService = new UserProfileService(
//   userProfileRepo,
//   rankService,
//   cloudinaryService
// );
// const internalAuthChecker = new InternalAuthChecker(
//   process.env.INTERNAL_SECRET_KEY || "defaultSecret"
// );
// const controller = new UserProfileController(
//   userProfileService,
//   internalAuthChecker
// );

// // Định nghĩa routes
// router.post("/", (req: Request, res: Response) =>
//   controller.createProfile(req, res)
// );
// router.get("/:userId", (req: Request, res: Response) =>
//   controller.getProfileByUserId(req, res)
// );
// router.put("/:userId", (req: Request, res: Response) =>
//   controller.replaceProfile(req, res)
// );

// router.patch("/:userId/loyalty", (req: Request, res: Response) => {
//   try {
//     const internalKey: string | undefined = req.header("X-Internal-Secret");
//     internalAuthChecker.requireInternal(internalKey); // kiểm tra key
//     controller.updateLoyalty(req, res);
//   } catch (error: any) {
//     res.status(403).json({ message: error.message || "Forbidden" });
//   }
// });

// router.delete("/:userId", (req: Request, res: Response) =>
//   controller.deleteProfile(req, res)
// );
// router.get("/search", (req: Request, res: Response) =>
//   controller.searchProfiles(req, res)
// );
// router.get("/:userId/rank", (req: Request, res: Response) =>
//   controller.getUserRankAndDiscount(req, res)
// );

// export default router;
