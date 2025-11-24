// import { Router } from "express";
// import { UserProfileController } from "../controllers/UserProfileController";

// const router = Router();

// // ⚡ Static routes trước
// router.get("/active", UserProfileController.getActiveProfiles);
// router.get("/search", UserProfileController.searchProfilesByName);
// router.get("/identifier/:identifier", UserProfileController.getProfileByIdentifier);

// // CRUD cơ bản
// router.post("/", UserProfileController.createProfile);
// router.get("/", UserProfileController.getAllProfiles);
// router.get("/:userId", UserProfileController.getProfile);
// router.put("/:userId", UserProfileController.updateProfile);
// router.delete("/:userId", UserProfileController.deleteProfile);

// // Loyalty points
// router.post("/:userId/add-points", UserProfileController.addLoyaltyPoints);
// router.put("/:userId/points", UserProfileController.updateLoyaltyPoints);

// export default router;
