export class FavoriteMovieResponse {
    tmdbId: number;
    addedAt: Date;   
  
    constructor(tmdbId: number, addedAt: Date) {
      this.tmdbId = tmdbId;
      this.addedAt = addedAt;
    }
  }
  