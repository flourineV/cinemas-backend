// src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { userContextMiddleware } = require("./security/user-context.middleware");
const app = express();

app.use(cors());
app.use(express.json());

// log mọi request
app.use((req, res, next) => {
  console.log(">>>", req.method, req.url);
  res.on("finish", () => {
    console.log("<<<", res.statusCode, req.method, req.url);
  });
  next();
});
// gắn user context từ header
app.use(userContextMiddleware);
// health
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});
// routes
const movieController = require("./controllers/movie.controller");
const movieStatsController = require("./controllers/movie-stats.controller");
app.use("/api/movies", movieController);
app.use("/api/movies/stats", movieStatsController);

module.exports = app;
