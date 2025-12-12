import { DataSource, Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { SeatPrice } from "../models/SeatPrice.entity";

export class SeatPriceRepository {
  private repo: Repository<SeatPrice>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(SeatPrice);
  }

  // Tìm giá theo seatType và ticketType
  async findBySeatTypeAndTicketType(
    seatType: string,
    ticketType: string
  ): Promise<SeatPrice | null> {
    return await this.repo.findOne({
      where: { seatType, ticketType },
    });
  }

  // Các hàm CRUD khác có thể dùng trực tiếp từ repo
  async save(seatPrice: SeatPrice): Promise<SeatPrice> {
    return await this.repo.save(seatPrice);
  }

  // Tìm tất cả giá
  async findAll(): Promise<SeatPrice[]> {
    return await this.repo.find();
  }

  // tìm giá bằng id
  async findById(id: string): Promise<SeatPrice | null> {
    return await this.repo.findOne({ where: { id } });
  }

  // tìm giá bằng id
  async existsById(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }

  // xóa giá
  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
