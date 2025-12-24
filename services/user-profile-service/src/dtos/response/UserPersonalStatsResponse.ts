export class UserPersonalStatsResponse {
  totalBookings: number;
  totalFavoriteMovies: number;
  loyaltyPoints: number;

  constructor(
    totalBookings: number,
    totalFavoriteMovies: number,
    loyaltyPoints: number
  ) {
    this.totalBookings = totalBookings;
    this.totalFavoriteMovies = totalFavoriteMovies;
    this.loyaltyPoints = loyaltyPoints;
  }
}
