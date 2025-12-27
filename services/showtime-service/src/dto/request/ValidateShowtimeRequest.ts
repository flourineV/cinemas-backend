export interface ValidateShowtimeRequest {
  roomId: string;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
  excludeShowtimeId?: string; // optional
}