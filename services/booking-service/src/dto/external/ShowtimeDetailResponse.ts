// src/dto/external/ShowtimeDetailResponse.ts
export interface ShowtimeDetailResponse {
  id: string; // UUID
  movieId: string; // UUID
  movieTitle: string;
  movieTitleEn?: string;
  theaterId: string; // UUID
  theaterName: string;
  theaterNameEn?: string;
  provinceId: string; // UUID
  provinceName: string;
  roomId: string; // UUID
  roomName: string;
  roomNameEn?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
}
