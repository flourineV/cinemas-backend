import { IsNotEmpty, IsUUID, IsDateString } from "class-validator";

export class ManagerProfileRequest {
  @IsUUID()
  @IsNotEmpty({ message: "Manager profile ID is required" })
  userProfileId!: string;

  @IsUUID()
  @IsNotEmpty({ message: "ManagedCinemaName is required" })
  managedCinemaName!: string;

  @IsDateString()
  @IsNotEmpty({ message: "Work startDate is required" })
  hireDate!: Date;
}
