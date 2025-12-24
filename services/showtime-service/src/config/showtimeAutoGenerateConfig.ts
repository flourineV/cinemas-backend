export interface ShowtimeAutoGenerateConfig {
  startHour: number;
  endHour: number;
  cleaningGapMinutes: number;
  primeTimeStartHour: number;
  primeTimeEnd: number;
}

export const showtimeAutoGenerateConfig: ShowtimeAutoGenerateConfig = {
  startHour: parseInt(process.env.SHOWTIME_START_HOUR || '4'),
  endHour: parseInt(process.env.SHOWTIME_END_HOUR || '24'),
  cleaningGapMinutes: parseInt(process.env.SHOWTIME_CLEANING_GAP || '15'),
  primeTimeStartHour: parseInt(process.env.SHOWTIME_PRIME_START || '17'),
  primeTimeEnd: parseInt(process.env.SHOWTIME_PRIME_END || '22'),
};
