import { Gender } from "../request/UserProfileRequest";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
}

export interface UserProfileResponse {
  id: string;
  userId: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  gender: Gender;
  dateOfBirth: Date;
  phoneNumber: string;
  nationalId: string;
  address: string;
  loyaltyPoint: number;
  rankName: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
