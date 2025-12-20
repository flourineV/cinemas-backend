import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "user_favorite_movies" })
export class UserFavoriteMovie {
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId: string;

  @PrimaryColumn({ name: "movie_id", type: "uuid" })
  movieId: string;

  @CreateDateColumn({ name: "added_at" })
  addedAt: Date;
}
