import { IsUUID, IsNotEmpty } from "class-validator";

export class FavoriteMovieRequest {
  @IsUUID()
  @IsNotEmpty({ message: "User ID is required" })
  userId: string;

  @IsUUID()
  @IsNotEmpty({ message: "Movie ID is required" })
  movieId: string;
}
