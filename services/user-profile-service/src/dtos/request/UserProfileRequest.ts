import {
  IsNotEmpty,
  IsEmail,
  Length,
  MaxLength,
  IsOptional,
  IsUUID,
} from "class-validator";

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export class UserProfileRequest {
  @IsUUID()
  @IsNotEmpty({ message: "User ID is required" })
  userId: string;

  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @Length(3, 30, { message: "Username must be between 3–30 characters" })
  username: string;

  @MaxLength(100, { message: "Full name must be less than 100 characters" })
  @IsOptional()
  fullName: string;

  @IsOptional()
  gender: Gender;

  @IsOptional()
  dateOfBirth: Date;

  @MaxLength(20)
  @IsOptional()
  phoneNumber: string;

  @MaxLength(20)
  @IsOptional()
  nationalId: string;

  @MaxLength(255)
  @IsOptional()
  address: string;
}
