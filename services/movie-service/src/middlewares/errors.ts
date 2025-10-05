import { NextFunction, Request, Response } from "express";
export const notFound = (_: Request, res: Response) =>
  res.status(404).json({ code: 404, message: "Not Found" });
export const errorHandler = (
  err: any,
  _: Request,
  res: Response,
  _n: NextFunction
) => {
  const status = err?.status || 500;
  res
    .status(status)
    .json({ code: status, message: err?.message || "Internal Server Error" });
};
