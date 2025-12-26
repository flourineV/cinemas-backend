import { DataSource } from "typeorm";
import { Room } from "../models/Room.js";
import { Theater } from "../models/Theater.js";
import type { RoomRequest } from "../dto/request/RoomRequest.js";
import type { RoomResponse } from "../dto/response/RoomResponse.js";
import { v4 as uuidv4 } from "uuid";

export class RoomService{
  private roomRepository = this.dataSource.getRepository(Room);
  private theaterRepository = this.dataSource.getRepository(Theater);
  constructor(
    private dataSource: DataSource
  ) {}
  async createRoom(request: RoomRequest): Promise<RoomResponse> {
    const theater = await this.theaterRepository.findOne({ where: { id: request.theaterId } });
    if (!theater) {
      throw new Error(`Theater with ID ${request.theaterId} not found`);
    }

    const room = this.roomRepository.create({
      id: uuidv4(),
      name: request.name,
      seatCount: request.seatCount,
      theater,
    });

    const savedRoom = await this.roomRepository.save(room);
    return this.mapToRoomResponse(savedRoom);
  }

  async getRoomById(id: string): Promise<RoomResponse> {
    const room = await this.roomRepository.findOne({ where: { id }, relations: ["theater"] });
    if (!room) {
      throw new Error(`Room with ID ${id} not found`);
    }
    return this.mapToRoomResponse(room);
  }

  async getAllRooms(): Promise<RoomResponse[]> {
    const rooms = await this.roomRepository.find({ relations: ["theater"] });
    return rooms.map(this.mapToRoomResponse);
  }

  async getRoomsByTheaterId(theaterId: string): Promise<RoomResponse[]> {
    const rooms = await this.roomRepository.find({
      where: { theater: { id: theaterId } },
      relations: ["theater"],
    });
    return rooms.map(this.mapToRoomResponse);
  }

  async updateRoom(id: string, request: RoomRequest): Promise<RoomResponse> {
    const room = await this.roomRepository.findOne({ where: { id }, relations: ["theater"] });
    if (!room) {
      throw new Error(`Room with ID ${id} not found`);
    }

    const theater = await this.theaterRepository.findOne({ where: { id: request.theaterId } });
    if (!theater) {
      throw new Error(`Theater with ID ${request.theaterId} not found`);
    }

    room.name = request.name;
    room.seatCount = request.seatCount;
    room.theater = theater;

    const updatedRoom = await this.roomRepository.save(room);
    return this.mapToRoomResponse(updatedRoom);
  }

  async deleteRoom(id: string): Promise<void> {
    const exists = await this.roomRepository.findOne({ where: { id } });
    if (!exists) {
      throw new Error(`Room with ID ${id} not found for deletion`);
    }
    await this.roomRepository.delete(id);
  }

  mapToRoomResponse(room: Room): RoomResponse {
    return {
      id: room.id,
      name: room.name,
      seatCount: room.seatCount,
      theaterName: room.theater?.name,
    };
  }
};
