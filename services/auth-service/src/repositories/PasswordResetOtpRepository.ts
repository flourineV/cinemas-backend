import { DataSource, Repository } from "typeorm";
import { PasswordResetOtp } from "../models/PasswordResetOtp.entity";

// khởi tạo repository password reset otp
export class PasswordResetOtpRepository {
  private repository: Repository<PasswordResetOtp>;
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(PasswordResetOtp);
  }

  // lưu password otp
  async save(otp: PasswordResetOtp): Promise<PasswordResetOtp> {
    return await this.repository.save(otp);
  }

  // tìm bởi otp và email
  async findByEmailAndOtp(
    email: string,
    otp: string
  ): Promise<PasswordResetOtp | null> {
    return await this.repository.findOne({ where: { email, otp } });
  }

  // tìm password otp gần nhất bằng email
  async findLatestValidOtp(
    email: string,
    now: Date
  ): Promise<PasswordResetOtp | null> {
    return await this.repository
      .createQueryBuilder("o")
      .where("o.email = :email", { email })
      .andWhere("o.expires_at > :now", { now })
      .orderBy("o.created_at", "DESC")
      .getOne();
  }

  // xóa password otp hết hạn
  async deleteExpiredOtps(now: Date): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .from(PasswordResetOtp)
      .where("expires_at < :now", { now })
      .execute();
  }

  // xóa tất cả password otp của email
  async deleteAllByEmail(email: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .from(PasswordResetOtp)
      .where("email = :email", { email })
      .execute();
  }
}
