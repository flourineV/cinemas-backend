import { IsNotEmpty, IsUUID, IsDateString } from "class-validator";

export class ManagerProfileRequest {
  @IsUUID()
  @IsNotEmpty({ message: "Manager profile ID is required" })
  userProfileId!: string;

  @IsUUID()
  @IsNotEmpty({ message: "ManagedCinemaId is required" })
  managedCinemaId!: string;

  @IsDateString()
  @IsNotEmpty({ message: "Work startDate is required" })
  hireDate!: Date;
}
