import express from "express";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);
app.use(errorHandler);

export default app;
