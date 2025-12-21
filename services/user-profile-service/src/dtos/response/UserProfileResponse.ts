import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
}

export class UserProfileResponse {
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
  address?: string;
  loyaltyPoint?: number;
  rankName: string | null;
  status: UserStatus;
  receivePromoEmail: boolean;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    userId: string,
    email: string,
    username: string,
    fullName: string,
    avatarUrl: string,
    gender: Gender,
    dateOfBirth: Date,
    phoneNumber: string,
    nationalId: string,
    address: string | undefined,
    loyaltyPoint: number | undefined,
    rankName: string | null,
    status: UserStatus,
    receivePromoEmail: boolean,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.userId = userId;
    this.email = email;
    this.username = username;
    this.fullName = fullName;
    this.avatarUrl = avatarUrl;
    this.gender = gender;
    this.dateOfBirth = dateOfBirth;
    this.phoneNumber = phoneNumber;
    this.nationalId = nationalId;
    this.address = address;
    this.loyaltyPoint = loyaltyPoint;
    this.rankName = rankName!;
    this.status = status;
    this.receivePromoEmail = receivePromoEmail;

    // Format ngày giống @JsonFormat trong Java
    this.createdAt = dayjs(createdAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
    this.updatedAt = dayjs(updatedAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
  }
}
