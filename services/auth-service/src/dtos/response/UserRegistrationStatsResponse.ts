export class UserRegistrationStatsResponse {
  private year: number;
  private month: number;
  private total: number;

  constructor(year: number, month: number, total: number) {
    this.year = year;
    this.month = month;
    this.total = total;
  }
}
