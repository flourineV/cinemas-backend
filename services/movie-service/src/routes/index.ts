import { Router } from "express";
import movieRoute from "./movie.route";

const r = Router();
r.use("/movies", movieRoute);

export default r;
