export interface GenerationStats {
  totalGenerated: number;
  totalSkipped: number;
  generatedMovies: string[];
  errors: string[];
}

export class GenerationStatsImpl implements GenerationStats {
  totalGenerated = 0;
  totalSkipped = 0;
  generatedMovies: string[] = [];
  errors: string[] = [];
}