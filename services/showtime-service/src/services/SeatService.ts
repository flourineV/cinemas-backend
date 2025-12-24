import { DataSource } from "typeorm";
import { Seat } from "../models/Seat.js";
import { Room } from "../models/Room.js";
import type { SeatRequest } from "../dto/request/SeatRequest.js";
import type { SeatResponse } from "../dto/response/SeatResponse.js";
import { v4 as uuidv4 } from "uuid";

export class SeatService {
  private seatRepository = this.dataSource.getRepository(Seat);
  private roomRepository = this.dataSource.getRepository(Room);

  constructor(private dataSource: DataSource) {}

  async createSeat(request: SeatRequest): Promise<SeatResponse> {
    const room = await this.roomRepository.findOne({ where: { id: request.roomId } });
    if (!room) throw new Error(`Room with ID ${request.roomId} not found`);

    const seat = this.seatRepository.create({
      id: uuidv4(),
      seatNumber: request.seatNumber,
      rowLabel: request.rowLabel,
      columnIndex: request.columnIndex,
      type: request.type,
      room,
    });

    const savedSeat = await this.seatRepository.save(seat);
    return this.mapToSeatResponse(savedSeat);
  }

  async createSeats(requests: SeatRequest[]): Promise<SeatResponse[]> {
    if (!requests || requests.length === 0) return [];

    const roomId = requests[0]!.roomId;
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new Error(`Room with ID ${roomId} not found for bulk creation`);

    const seatsToSave = requests.map((req) =>
      this.seatRepository.create({
        id: uuidv4(),
        seatNumber: req.seatNumber,
        rowLabel: req.rowLabel,
        columnIndex: req.columnIndex,
        type: req.type,
        room,
      })
    );

    const savedSeats = await this.seatRepository.save(seatsToSave);
    return savedSeats.map((s) => this.mapToSeatResponse(s));
  }

  async getSeatById(id: string): Promise<SeatResponse> {
    const seat = await this.seatRepository.findOne({ where: { id }, relations: ["room"] });
    if (!seat) throw new Error(`Seat with ID ${id} not found`);
    return this.mapToSeatResponse(seat);
  }

  async getAllSeats(): Promise<SeatResponse[]> {
    const seats = await this.seatRepository.find({ relations: ["room"] });
    return seats.map((s) => this.mapToSeatResponse(s));
  }

  async getSeatsByRoomId(roomId: string): Promise<SeatResponse[]> {
    const seats = await this.seatRepository.find({
      where: { room: { id: roomId } },
      relations: ["room"],
    });
    return seats.map((s) => this.mapToSeatResponse(s));
  }

  async updateSeat(id: string, request: SeatRequest): Promise<SeatResponse> {
    const seat = await this.seatRepository.findOne({ where: { id }, relations: ["room"] });
    if (!seat) throw new Error(`Seat with ID ${id} not found`);

    const room = await this.roomRepository.findOne({ where: { id: request.roomId } });
    if (!room) throw new Error(`Room with ID ${request.roomId} not found`);

    seat.seatNumber = request.seatNumber;
    seat.rowLabel = request.rowLabel;
    seat.columnIndex = request.columnIndex;
    seat.type = request.type;
    seat.room = room;

    const updatedSeat = await this.seatRepository.save(seat);
    return this.mapToSeatResponse(updatedSeat);
  }

  async deleteSeat(id: string): Promise<void> {
    const exists = await this.seatRepository.findOne({ where: { id } });
    if (!exists) throw new Error(`Seat with ID ${id} not found for deletion`);
    await this.seatRepository.delete(id);
  }

  /** Private helper to map entity to DTO */
  private mapToSeatResponse(seat: Seat): SeatResponse {
    return {
      id: seat.id,
      seatNumber: seat.seatNumber,
      rowLabel: seat.rowLabel,
      columnIndex: seat.columnIndex,
      type: seat.type,
      roomName: seat.room?.name,
    };
  }
}
