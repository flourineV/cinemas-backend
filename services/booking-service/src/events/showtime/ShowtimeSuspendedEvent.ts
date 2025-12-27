export interface ShowtimeSuspendedEvent {
  showtimeId: string; // UUID
  movieId: string; // UUID
  affectedBookingIds: string[]; // UUID[]
  reason: string;
}
