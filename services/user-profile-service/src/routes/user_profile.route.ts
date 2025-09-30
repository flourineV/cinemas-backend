import express from "express";
import { UserProfileController } from "../controllers/UserProfileController";

const router = express.Router();

router.post("/", UserProfileController.createProfile);
router.get("/:userId", UserProfileController.getProfile);
router.get("/identifier/:identifier", UserProfileController.getProfileByIdentifier);
router.get("/", UserProfileController.getAllProfiles);
router.get("/active", UserProfileController.getActiveProfiles);
router.put("/:userId", UserProfileController.updateProfile);
router.delete("/:userId", UserProfileController.deleteProfile);
router.get("/search", UserProfileController.searchProfilesByName);
router.post("/:userId/points/add", UserProfileController.addLoyaltyPoints);
router.put("/:userId/points/update", UserProfileController.updateLoyaltyPoints);

export default router;
