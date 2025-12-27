export interface ShowtimeResponse {
  id: string;
  movieId: string;
  theaterName: string;
  roomId: string;
  roomName: string;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
  status: string;
}