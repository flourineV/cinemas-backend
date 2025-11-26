import { IsNotEmpty, IsUUID, IsDateString } from "class-validator";

export class StaffProfileRequest {
  @IsUUID()
  @IsNotEmpty({ message: "Staff profile ID is required" })
  userProfileId!: string;

  @IsUUID()
  @IsNotEmpty({ message: "CinemaId is required" })
  cinemaId!: string;

  @IsDateString()
  @IsNotEmpty({ message: "Work startDate is required" })
  startDate!: Date;
}
