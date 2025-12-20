// import { Request, Response } from "express";
// import { StaffProfileService } from "../services/StaffProfileService";
// import { AuthChecker } from "../middlewares/AuthChecker";
// import { StaffProfileRequest } from "../dtos/request/StaffProfileRequest";
// import { StaffProfile } from "../models/StaffProfile.entity";

// export class StaffProfileController {
//   private readonly staffService: StaffProfileService;

//   constructor(staffService: StaffProfileService) {
//     this.staffService = staffService;
//   }

//   async createStaff(req: Request, res: Response): Promise<void> {
//     try {
//       AuthChecker.requireManagerOrAdmin(req);
//       const request: StaffProfileRequest = req.body;
//       const created: StaffProfile = await this.staffService.createStaff(
//         request.userProfileId,
//         request.cinemaId,
//         request.startDate
//       );
//       res.json(created);
//     } catch (error: any) {
//       res.status(403).json({ message: error.message || "Forbidden" });
//     }
//   }

//   async getStaffByCinema(req: Request, res: Response): Promise<void> {
//     try {
//       AuthChecker.requireManagerOrAdmin(req);
//       const cinemaId: string = req.params.cinemaId;
//       const staffList: StaffProfile[] =
//         await this.staffService.getStaffByCinema(cinemaId);
//       res.json(staffList);
//     } catch (error: any) {
//       res.status(403).json({ message: error.message || "Forbidden" });
//     }
//   }

//   async getStaffByUserProfile(req: Request, res: Response): Promise<void> {
//     try {
//       AuthChecker.requireManagerOrAdmin(req);
//       const userProfileId: string = req.params.userProfileId;
//       const staff: StaffProfile =
//         await this.staffService.getStaffByUserProfileId(userProfileId);
//       res.json(staff);
//     } catch (error: any) {
//       res.status(403).json({ message: error.message || "Forbidden" });
//     }
//   }

//   async getAllStaff(req: Request, res: Response): Promise<void> {
//     try {
//       AuthChecker.requireManagerOrAdmin(req);
//       const staffList: StaffProfile[] = await this.staffService.getAllStaff();
//       res.json(staffList);
//     } catch (error: any) {
//       res.status(403).json({ message: error.message || "Forbidden" });
//     }
//   }

//   async deleteStaff(req: Request, res: Response): Promise<void> {
//     try {
//       AuthChecker.requireManagerOrAdmin(req);
//       const staffId: string = req.params.staffId;
//       await this.staffService.deleteStaff(staffId);
//       res.status(204).send();
//     } catch (error: any) {
//       res.status(403).json({ message: error.message || "Forbidden" });
//     }
//   }
// }
