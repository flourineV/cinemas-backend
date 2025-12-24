import { UserProfileRepository } from "../repositories/UserProfileRepository";

export class PromotionEmailService {
  constructor(private profileRepository: UserProfileRepository) {}

  async getSubscribedUsersEmails(): Promise<string[]> {
    const profiles = await this.profileRepository.findByReceivePromoEmailTrue();
    return profiles.map((p) => p.email);
  }
}
