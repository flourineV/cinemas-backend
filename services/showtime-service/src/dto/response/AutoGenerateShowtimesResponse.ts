export interface AutoGenerateShowtimesResponse {
  totalGenerated: number;
  totalSkipped: number;
  generatedMovies: string[];
  skippedMovies: string[];
  errors: string[];
  message: string;
}