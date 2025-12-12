// src/services/PricingService.ts
import { SeatPriceRepository } from "../repositories/SeatPriceRepository";
import { SeatPriceRequest } from "../dtos/request/SeatPriceRequest";
import { SeatPriceResponse } from "../dtos/response/SeatPriceResponse";
import { SeatPrice } from "../models/SeatPrice.entity";

export class PricingService {
  private seatPriceRepository: SeatPriceRepository;

  constructor(seatPriceRepository: SeatPriceRepository) {
    this.seatPriceRepository = seatPriceRepository;
  }

  // --- Phương thức tra cứu giá (giữ nguyên) ---
  async getSeatBasePrice(
    seatType: string,
    ticketType: string
  ): Promise<SeatPriceResponse | null> {
    const seatPrice =
      await this.seatPriceRepository.findBySeatTypeAndTicketType(
        seatType,
        ticketType
      );
    if (!seatPrice) {
      console.warn(
        `❌ Price not found for SeatType: ${seatType} and TicketType: ${ticketType}`
      );
      return null;
    }
    return this.mapToResponse(seatPrice);
  }

  // Tạo mới
  async createSeatPrice(request: SeatPriceRequest): Promise<SeatPriceResponse> {
    const exists = await this.seatPriceRepository.findBySeatTypeAndTicketType(
      request.seatType,
      request.ticketType
    );
    if (exists) {
      throw new Error(
        `Price for SeatType ${request.seatType} and TicketType ${request.ticketType} already exists.`
      );
    }
    const entity = this.mapToEntity(request);
    const saved = await this.seatPriceRepository.save(entity);
    console.info(`💰 Created new seat price: ${saved.id}`);
    return this.mapToResponse(saved);
  }

  // Cập nhật
  async updateSeatPrice(
    id: string,
    request: SeatPriceRequest
  ): Promise<SeatPriceResponse> {
    const existing = await this.seatPriceRepository.findById(id);
    if (!existing) {
      throw new Error(`SeatPrice not found with ID: ${id}`);
    }
    existing.basePrice = request.basePrice;
    existing.description = request.description;
    const updated = await this.seatPriceRepository.save(existing);
    console.info(`🔄 Updated seat price: ${updated.id}`);
    return this.mapToResponse(updated);
  }

  // Xóa
  async deleteSeatPrice(id: string): Promise<void> {
    const exists = await this.seatPriceRepository.existsById(id);
    if (!exists) {
      throw new Error(`SeatPrice not found with ID: ${id}`);
    }
    await this.seatPriceRepository.deleteById(id);
    console.warn(`🗑️ Deleted seat price: ${id}`);
  }

  // Lấy tất cả
  async getAllSeatPrices(): Promise<SeatPriceResponse[]> {
    const list = await this.seatPriceRepository.findAll();
    return list.map((item) => this.mapToResponse(item));
  }

  // Mapper helpers
  private mapToResponse(seatPrice: SeatPrice): SeatPriceResponse {
    return new SeatPriceResponse(
      seatPrice.seatType,
      seatPrice.ticketType,
      Number(seatPrice.basePrice)
    );
  }

  private mapToEntity(request: SeatPriceRequest): SeatPrice {
    const entity = new SeatPrice();
    entity.seatType = request.seatType;
    entity.ticketType = request.ticketType;
    entity.basePrice = request.basePrice;
    entity.description = request.description;
    return entity;
  }
}
