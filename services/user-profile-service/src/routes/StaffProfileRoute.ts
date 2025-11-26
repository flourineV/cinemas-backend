import { Router, Request, Response } from "express";
import { StaffProfileController } from "../controllers/StaffProfileController";
import { StaffProfileService } from "../services/StaffProfileService";
import { StaffProfileRepository } from "../repositories/StaffProfileRepository";
import { AppDataSource } from "../config/Database";
import { UserProfileRepository } from "../repositories/UserProfileRepository";

const router = Router();

const staffRepo = new StaffProfileRepository(AppDataSource);
const userProfileRepo = new UserProfileRepository(AppDataSource);
const staffService = new StaffProfileService(staffRepo, userProfileRepo);
const controller = new StaffProfileController(staffService);

router.post("/", (req: Request, res: Response) =>
  controller.createStaff(req, res)
);
router.get("/cinema/:cinemaId", (req: Request, res: Response) =>
  controller.getStaffByCinema(req, res)
);
router.get("/user/:userProfileId", (req: Request, res: Response) =>
  controller.getStaffByUserProfile(req, res)
);
router.get("/", (req: Request, res: Response) =>
  controller.getAllStaff(req, res)
);
router.delete("/:staffId", (req: Request, res: Response) =>
  controller.deleteStaff(req, res)
);

export default router;
