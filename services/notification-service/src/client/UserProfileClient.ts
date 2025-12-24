import axios from "axios";

export interface UserProfileResponse {
  email: string;
  fullName: string;
  username: string;
}

const USER_PROFILE_SERVICE_URL =
  process.env.USER_PROFILE_SERVICE_URL ||
  "http://user-profile-service:8082";

const INTERNAL_SECRET_KEY = process.env.APP_INTERNAL_SECRET_KEY!;

const userProfileAxios = axios.create({
  baseURL: USER_PROFILE_SERVICE_URL,
  timeout: 5000,
  headers: {
    "X-Internal-Secret": INTERNAL_SECRET_KEY,
  },
});

export class UserProfileClient {
  async getUserProfile(userId: string): Promise<UserProfileResponse | null> {
    try {
      const res = await userProfileAxios.get<UserProfileResponse>(
        `/profiles/${userId}`
      );
      return res.data;
    } catch (err: any) {
      console.error(
        `Failed to fetch user profile for userId ${userId}`,
        err.message
      );
      return null;
    }
  }

  async getSubscribedUsersEmails(): Promise<string[]> {
    try {
      const res = await userProfileAxios.get<string[]>(
        `/profiles/subscribed-emails`
      );
      return res.data ?? [];
    } catch (err: any) {
      console.error(
        "Failed to fetch subscribed users emails",
        err.message
      );
      return [];
    }
  }
}

export const userProfileClient = new UserProfileClient();
