// middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  if (err.code === "P2002") {
    // Prisma unique constraint violation
    return res.status(409).json({
      success: false,
      error: "DuplicateEntry",
      message: "A record with this information already exists",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "ValidationError",
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    error: "InternalServerError",
    message: "Something went wrong. Please try again later.",
  });
};
