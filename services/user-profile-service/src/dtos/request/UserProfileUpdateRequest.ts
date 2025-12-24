export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export class UserProfileUpdateRequest {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  gender?: Gender;
}
