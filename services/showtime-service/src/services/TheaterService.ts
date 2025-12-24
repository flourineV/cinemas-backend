import { Theater } from "../models/Theater.js";
import { Province } from "../models/Province.js";
import type { TheaterRequest } from "../dto/request/TheaterRequest.js";
import type { TheaterResponse } from "../dto/response/TheaterResponse.js";
import type { MovieShowtimesResponse } from "../dto/response/MovieShowtimesResponse.js";
import { ShowtimeService } from "./ShowtimeService.js";
import { v4 as uuidv4 } from "uuid";
import type { DataSource } from "typeorm";

export class TheaterService{
    private theaterRepository = this.dataSource.getRepository(Theater);
    private provinceRepository = this.dataSource.getRepository(Province);
    constructor(
      private dataSource: DataSource,
      private showtimeService: ShowtimeService // inject the dependent service
  ) {}
  async getMoviesByTheater(theaterId: string): Promise<MovieShowtimesResponse[]> {
    const theater = await this.theaterRepository.findOne({ where: { id: theaterId } });
    if (!theater) {
      throw new Error(`Theater not found: ${theaterId}`);
    }
    return this.showtimeService.getMoviesByTheater(theaterId);
  }

  async searchByName(keyword: string): Promise<TheaterResponse[]> {
    if (!keyword || keyword.trim() === "") {
      return this.getAllTheaters();
    }
    const theaters = await this.theaterRepository
      .createQueryBuilder("theater")
      .where("LOWER(theater.name) LIKE LOWER(:keyword)", { keyword: `%${keyword}%` })
      .getMany();
    return theaters.map((t) => this.mapToTheaterResponse(t));
  }

  async createTheater(request: TheaterRequest): Promise<TheaterResponse> {
    const province = await this.provinceRepository.findOne({ where: { id: request.provinceId } });
    if (!province) {
      throw new Error(`Province with ID ${request.provinceId} not found`);
    }

    const theater = this.theaterRepository.create({
      id: uuidv4(),
      name: request.name,
      address: request.address,
      province,
      description: request.description,
      theaterImageUrl: request.imageUrl,
    });

    const savedTheater = await this.theaterRepository.save(theater);
    return this.mapToTheaterResponse(savedTheater);
  }

  async getTheaterById(id: string): Promise<TheaterResponse> {
    const theater = await this.theaterRepository.findOne({ where: { id }, relations: ["province"] });
    if (!theater) {
      throw new Error("Theater not found");
    }
    return this.mapToTheaterResponse(theater);
  }

  async getAllTheaters(): Promise<TheaterResponse[]> {
    const theaters = await this.theaterRepository.find({ relations: ["province"] });
    return theaters.map(this.mapToTheaterResponse);
  }

  async getTheatersByProvince(provinceId: string): Promise<TheaterResponse[]> {
    const theaters = await this.theaterRepository.find({
      where: { province: { id: provinceId } },
      relations: ["province"],
    });
    return theaters.map((t) => this.mapToTheaterResponse(t));
  }

  async updateTheater(id: string, request: TheaterRequest): Promise<TheaterResponse> {
    const theater = await this.theaterRepository.findOne({ where: { id }, relations: ["province"] });
    if (!theater) {
      throw new Error("Theater not found");
    }

    const province = await this.provinceRepository.findOne({ where: { id: request.provinceId } });
    if (!province) {
      throw new Error(`Province with ID ${request.provinceId} not found`);
    }

    theater.name = request.name;
    theater.address = request.address;
    theater.province = province;
    theater.description = request.description;
    theater.theaterImageUrl = request.imageUrl;

    const updated = await this.theaterRepository.save(theater);
    return this.mapToTheaterResponse(updated);
  }

  async deleteTheater(id: string): Promise<void> {
    await this.theaterRepository.delete(id);
  }

  // Helper mapping
  private mapToTheaterResponse(theater: Theater): TheaterResponse {
    return {
      id: theater.id,
      name: theater.name,
      address: theater.address,
      description: theater.description,
      provinceName: theater.province?.name,
      imageUrl: theater.theaterImageUrl,
    };
  }
};
