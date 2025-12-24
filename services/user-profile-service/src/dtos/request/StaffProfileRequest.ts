import { IsNotEmpty, IsUUID, IsDateString } from "class-validator";

export class StaffProfileRequest {
  @IsUUID()
  @IsNotEmpty({ message: "Staff profile ID is required" })
  userProfileId!: string;

  @IsUUID()
  @IsNotEmpty({ message: "CinemaName is required" })
  cinemaName!: string;

  @IsDateString()
  @IsNotEmpty({ message: "HireDate is required" })
  hireDate!: Date;
}
