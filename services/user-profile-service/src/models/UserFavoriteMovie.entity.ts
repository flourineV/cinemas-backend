import {
    Entity,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
  } from "typeorm";
  import { UserProfile } from "./UserProfile.entity";
  
  @Entity("user_favorite_movies")
  export class UserFavoriteMovie {
    @PrimaryColumn({ name: "user_id", type: "uuid" })
    userId: string;
  
    @PrimaryColumn({ name: "tmdb_id", type: "int" })
    tmdbId: number;
  
    @ManyToOne(() => UserProfile, (user) => user.favoriteMovies, {
      onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id", foreignKeyConstraintName: "fk_favorite_user" })
    user: UserProfile;
  
    @CreateDateColumn({ name: "added_at" })
    addedAt: Date;
  }
  