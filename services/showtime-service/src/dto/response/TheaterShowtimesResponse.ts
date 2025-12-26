export interface TheaterShowtimesResponse {
  theaterId: string;
  theaterName: string;
  theaterAddress: string;
  theaterImageUrl: string;
  showtimes: TheaterShowtimesResponse.ShowtimeInfo[];
}

export namespace TheaterShowtimesResponse {
  export interface ShowtimeInfo {
    showtimeId: string;
    roomId: string;
    roomName: string;
    startTime: string;
    endTime: string;
  }
}