const { Schema, model } = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const MovieStatus = require("./movie-status.enum");

const movieSummarySchema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: String,
    titleEn: { type: String, default: null },
    posterUrl: String,
    age: String,
    status: {
      type: String,
      enum: Object.values(MovieStatus),
      default: MovieStatus.UPCOMING,
    },
    spokenLanguages: [String],
    country: String,
    countryCode: { type: String, default: null },
    countryEn: { type: String, default: null },
    time: Number,
    genres: [String],
    genreIds: { type: [Number], default: [] },
    genresEn: { type: [String], default: [] },
    trailer: String,
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    popularity: { type: Number, default: 0 },
  },
  {
    collection: "movie_summaries",
    timestamps: true,
  }
);

movieSummarySchema.virtual("id").get(function () {
  return this._id;
});

movieSummarySchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    delete ret._id;
  },
});

const MovieSummary = model("MovieSummary", movieSummarySchema);

module.exports = MovieSummary;
