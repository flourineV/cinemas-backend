export interface ShowtimeRequest {
  movieId: string;
  theaterId: string;
  roomId: string;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
}