// src/entities/movie-detail.entity.js
const { Schema, model } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const movieDetailSchema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4, // UUID giống Java
    },
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: String,
    titleEn: { type: String, default: null },
    age: String,
    status: String, // nếu muốn lưu MovieStatus, không bắt buộc
    posterUrl: String,
    genres: [String],
    genreIds: { type: [Number], default: [] },
    genresEn: { type: [String], default: [] },
    time: Number,
    country: String,
    countryCode: { type: String, default: null },
    countryEn: { type: String, default: null },
    spokenLanguages: [String],
    crew: [String],
    cast: [String],
    releaseDate: String,
    overview: String,
    overviewEn: { type: String, default: null },
    trailer: String,
  },
  {
    collection: "movie_details",
    timestamps: true,
  }
);

// map _id -> id khi toJSON
movieDetailSchema.virtual("id").get(function () {
  return this._id;
});

movieDetailSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    delete ret._id;
  },
});

const MovieDetail = model("MovieDetail", movieDetailSchema);

module.exports = MovieDetail;
