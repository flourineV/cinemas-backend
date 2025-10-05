import { Request, Response, NextFunction } from "express";
import * as svc from "../services/movie.service";

export const sync = async (_: Request, res: Response, next: NextFunction) => {
  try {
    const r = await svc.syncGenres();
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const nowPlaying = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page0 = Number(req.query.page ?? 0),
      size = Number(req.query.size ?? 10);
    res.json(await svc.getNowPlaying(page0, size));
  } catch (e) {
    next(e);
  }
};

export const upcoming = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page0 = Number(req.query.page ?? 0),
      size = Number(req.query.size ?? 10);
    res.json(await svc.getUpcoming(page0, size));
  } catch (e) {
    next(e);
  }
};

export const search = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const title = String(req.query.title || "");
    const page0 = Number(req.query.page ?? 0),
      size = Number(req.query.size ?? 10);
    res.json(await svc.searchMovies(title, page0, size));
  } catch (e) {
    next(e);
  }
};

export const detail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json(await svc.getDetail(Number(req.params.tmdbId)));
  } catch (e) {
    next(e);
  }
};
// Rating
import {
  upsertRating,
  listRatings,
  getRatingSummary,
} from "../repositories/rating.repo";

export async function addRating(req, res, next) {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const { rating, comment } = req.body;
    // const userId = req.user?.id; // nếu có
    const row = await upsertRating(tmdbId, rating, comment /*, userId*/);
    res.json(row);
  } catch (e) {
    next(e);
  }
}

export async function getRatings(req, res, next) {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const data = await listRatings(tmdbId, 50, 0);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function getRatingStat(req, res, next) {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const stat = await getRatingSummary(tmdbId);
    res.json(stat); // { average, count }
  } catch (e) {
    next(e);
  }
}
// Admin CRUD (staff)
import {
  adminCreateMovie,
  adminUpdateMovie,
  adminDeleteMovie,
} from "../repositories/movie.repo";

export async function adminCreate(req, res, next) {
  try {
    res.json(await adminCreateMovie(req.body));
  } catch (e) {
    next(e);
  }
}
export async function adminUpdate(req, res, next) {
  try {
    res.json(await adminUpdateMovie(Number(req.params.tmdbId), req.body));
  } catch (e) {
    next(e);
  }
}
export async function adminDelete(req, res, next) {
  try {
    res.json({ deleted: await adminDeleteMovie(Number(req.params.tmdbId)) });
  } catch (e) {
    next(e);
  }
}
// by-genre
import { getByGenres } from "../services/movie.service";

export async function discoverByGenres(req, res, next) {
  try {
    const ids = String(req.query.withGenres || "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter(Boolean);
    const page = Number(req.query.page || 0);
    const size = Number(req.query.size || 10);
    res.json(await getByGenres(ids, page, size));
  } catch (e) {
    next(e);
  }
}
