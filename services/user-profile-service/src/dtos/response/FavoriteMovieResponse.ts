import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export class FavoriteMovieResponse {
  movieId: string;
  addedAt: string;

  constructor(movieId: string, addedAt: Date) {
    this.movieId = movieId;
    this.addedAt = dayjs(addedAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
  }
}
