export interface ShowtimeResponse {
  id: string; // UUID
  movieId: string; // UUID
  theaterName: string;
  theaterNameEn?: string;
  roomName: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  price: string; // numeric as string
  status: string;
}
