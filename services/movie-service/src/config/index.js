require("dotenv").config();

module.exports = {
  port: process.env.PORT || 8083,
  tmdbApiKey: process.env.TMDB_API_KEY || "",
  internalAuthSecret: process.env.INTERNAL_AUTH_SECRET || "",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27018/cinehub",
  internalAuthSecret: process.env.APP_INTERNAL_SECRET_KEY,
};
