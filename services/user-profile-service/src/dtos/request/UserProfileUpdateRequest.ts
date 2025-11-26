import { IsOptional } from "class-validator";
import { Gender } from "./UserProfileRequest";

export class UserProfileUpdateRequest {
  @IsOptional()
  fullName?: string;

  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  avatarUrl?: string;

  @IsOptional()
  gender?: Gender;
}
