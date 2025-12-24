export interface MovieShowtimesResponse {
  movieId: string;
  showtimes: MovieShowtimesResponse.ShowtimeInfo[];
}

export namespace MovieShowtimesResponse {
  export interface ShowtimeInfo {
    showtimeId: string;
    roomId: string;
    roomName: string;
    startTime: string;
    endTime: string;
    status: string;
  }
}