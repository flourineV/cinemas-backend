const express = require("express");
const cors = require("cors");
const config = require("./config");
const reviewRouter = require("./controllers/reviewController");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// giống Java: prefix /api/reviews
app.use("/api/reviews", reviewRouter);

app.listen(config.port, () => {
  console.log(`Review service is running on port ${config.port}`);
});
