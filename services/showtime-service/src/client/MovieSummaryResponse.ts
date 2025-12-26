export interface MovieSummaryResponse {
  id: string;                // UUID dưới dạng string
  tmdbId: number;
  title: string;
  posterUrl: string;
  age: string;
  status: string;
  time: number;              // duration in minutes
  spokenLanguages: string[];
  genres: string[];
  trailer: string;
  startDate: string;         // ISO date string
  endDate: string;           // ISO date string
  popularity: number;
}
