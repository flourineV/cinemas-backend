import express, { Request, Response } from "express";
import axios from "axios";
import { servicesConfig } from "../config/services.config";

const router = express.Router();

// GET /api/search?keyword=...
router.get("/", async (req: Request, res: Response) => {
  const rawKeyword = (req.query.keyword as string) || "";
  const keyword = rawKeyword.trim();

  if (!keyword) {
    return res.status(400).json({ error: "keyword is required" });
  }

  const encoded = encodeURIComponent(keyword);
  const errors: string[] = [];

  let movies: any[] = [];
  let theaters: any[] = []; // phần này để bạn khác làm sau

  // ----- MOVIE SERVICE -----
  try {
    const movieUrl = `${servicesConfig.movie.baseUrl}/api/movies/search?keyword=${encoded}`;
    const movieResp = await axios.get(movieUrl);

    const data = movieResp.data;

    // Nếu movie-service trả về object kiểu { content: [...] }
    if (Array.isArray(data)) {
      movies = data;
    } else if (Array.isArray(data?.content)) {
      movies = data.content;
    } else {
      movies = [];
    }
  } catch (e: any) {
    console.error("Movie service error:", e.message || e);
    errors.push("Movie service error: " + (e.message || String(e)));
  }

  // ----- THEATER SERVICE (Tuấn) -----
  // hiện tại chưa gọi nên để trống, không coi là lỗi để partial = false
  theaters = [];

  const partial = errors.length > 0;

  return res.json({
    movies,
    theaters,
    partial,
    errors,
  });
});

export default router;
