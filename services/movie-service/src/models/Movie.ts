import { Schema, model, Document } from 'mongoose';

interface IMovie extends Document {
  tmdbId: number;
  title: string;
  overview?: string;
  releaseDate?: Date;
  genres: { id: number; name: string }[];
  posterPath?: string;
  runtime?: number;
}

const movieSchema = new Schema<IMovie>({
  tmdbId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  overview: String,
  releaseDate: Date,
  genres: [{ id: Number, name: String }],
  posterPath: String,
  runtime: Number,
}, { timestamps: true });

movieSchema.index({ tmdbId: 1 });

export default model<IMovie>('Movie', movieSchema);