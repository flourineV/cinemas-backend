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
      index: true,
    },
    title: String,
    posterUrl: String,
    age: String,
    status: {
      type: String,
      enum: Object.values(MovieStatus),
      default: MovieStatus.UPCOMING,
    },
    spokenLanguages: [String],
    country: String,
    time: Number,
    genres: [String],
    trailer: String,
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
