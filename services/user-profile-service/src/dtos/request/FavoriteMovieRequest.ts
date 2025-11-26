import { IsNotEmpty, IsUUID, IsInt } from "class-validator";

export class FavoriteMovieRequest {
  @IsNotEmpty({ message: "User ID is required" })
  @IsUUID()
  userId: string;

  @IsNotEmpty({ message: "TMDb ID is required" })
  @IsInt()
  tmdbId: number;
}
