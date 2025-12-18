import { RefundVoucherRepository } from "../repositories/RefundVoucherRepository";
import { RefundVoucherRequest } from "../dtos/request/RefundVoucherRequest";
import { RefundVoucherResponse } from "../dtos/response/RefundVoucherResponse";
import { RefundVoucher } from "../models/RefundVoucher.entity";
import { v4 as uuidv4 } from "uuid";

export class RefundVoucherService {
  private refundVoucherRepository: RefundVoucherRepository;

  constructor(refundVoucherRepository: RefundVoucherRepository) {
    this.refundVoucherRepository = refundVoucherRepository;
  }

  async createRefundVoucher(
    request: RefundVoucherRequest
  ): Promise<RefundVoucherResponse> {
    // Kiểm tra số voucher đã tạo trong tháng hiện tại
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0
    );
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0
    );

    const countThisMonth =
      await this.refundVoucherRepository.countByUserIdAndCreatedAtBetween(
        request.userId,
        startOfMonth,
        endOfMonth
      );

    if (countThisMonth >= 2) {
      throw new Error("❌ Bạn chỉ được hoàn vé tối đa 2 lần mỗi tháng.");
    }

    // Tạo voucher mới
    const code = await this.generateVoucherCode();

    const voucher = new RefundVoucher();
    voucher.userId = request.userId;
    voucher.code = code;
    voucher.value = request.value;
    voucher.isUsed = false;
    voucher.createdAt = new Date();
    voucher.expiredAt = request.expiredAt
      ? new Date(request.expiredAt)
      : new Date(new Date().setMonth(new Date().getMonth() + 6));

    await this.refundVoucherRepository.save(voucher);
    console.info(`Created refund voucher ${code} for user ${request.userId}`);

    return this.mapToResponse(voucher);
  }

  async getAllVouchers(): Promise<RefundVoucherResponse[]> {
    const vouchers = await this.refundVoucherRepository.findAll();
    return vouchers.map((v) => this.mapToResponse(v));
  }

  async getVouchersByUser(userId: string): Promise<RefundVoucherResponse[]> {
    const vouchers = await this.refundVoucherRepository.findAll();
    return vouchers
      .filter((v) => v.userId === userId)
      .map((v) => this.mapToResponse(v));
  }

  async markAsUsed(code: string): Promise<RefundVoucherResponse> {
    const voucher = await this.refundVoucherRepository.findByCode(code);
    if (!voucher) {
      throw new Error("Voucher không tồn tại");
    }

    if (voucher.isUsed) {
      throw new Error("Voucher đã được sử dụng");
    }

    voucher.isUsed = true;
    await this.refundVoucherRepository.save(voucher);

    console.info(`Voucher ${code} marked as used`);
    return this.mapToResponse(voucher);
  }

  private async generateVoucherCode(): Promise<string> {
    let code: string;
    do {
      code = "VCH-" + uuidv4().substring(0, 8).toUpperCase();
    } while (await this.refundVoucherRepository.existsByCode(code));
    return code;
  }

  private mapToResponse(v: RefundVoucher): RefundVoucherResponse {
    return new RefundVoucherResponse(
      v.id,
      v.code,
      v.userId,
      v.value,
      v.isUsed,
      v.createdAt,
      v.expiredAt
    );
  }
}
