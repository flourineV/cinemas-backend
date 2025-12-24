export class TimeSlot {
  constructor(
    public start: Date,
    public end: Date
  ) {}

  getDurationMinutes(): number {
    const diffMs = this.end.getTime() - this.start.getTime();
    return Math.floor(diffMs / (1000 * 60)); // convert ms → minutes
  }

  compareTo(other: TimeSlot): number {
    return this.start.getTime() - other.start.getTime();
  }
}