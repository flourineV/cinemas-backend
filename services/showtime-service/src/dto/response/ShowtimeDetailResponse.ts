export interface ShowtimeDetailResponse {
  id: string;
  movieId: string;
  movieTitle: string;
  theaterId: string;
  theaterName: string;
  theaterNameEn: string;
  provinceId: string;
  provinceName: string;
  provinceNameEn: string;
  roomId: string;
  roomName: string;
  roomNameEn: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
}