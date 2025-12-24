import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { UserProfileResponse } from "./UserProfileResponse";

dayjs.extend(utc);
dayjs.extend(timezone);

export class ManagerProfileResponse {
  id: string;
  userProfileId: string;
  userProfile: UserProfileResponse;
  managedCinemaName: string;
  hireDate: Date;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    userProfileId: string,
    userProfile: UserProfileResponse,
    managedCinemaName: string,
    hireDate: Date,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.userProfileId = userProfileId;
    this.userProfile = userProfile;
    this.managedCinemaName = managedCinemaName;
    this.hireDate = hireDate;

    // Format ngày giống @JsonFormat trong Java
    this.createdAt = dayjs(createdAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
    this.updatedAt = dayjs(updatedAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
  }
}
