export interface MovieWithTheatersResponse {
  movieId: string;
  theaters: MovieWithTheatersResponse.TheaterWithShowtimes[];
}

export namespace MovieWithTheatersResponse {
  export interface TheaterWithShowtimes {
    theaterId: string;
    theaterName: string;
    theaterAddress: string;
    showtimes: ShowtimeDetail[];
  }

  export interface ShowtimeDetail {
    showtimeId: string;
    roomName: string;
    startTime: string;
    endTime: string;
  }
}