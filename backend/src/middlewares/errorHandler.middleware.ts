import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/appError.js";
import { HTTPSTATUS } from "../config/http.config.js";
export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): any => {
  console.error(`Error occurred in PATH: ${req.path}`, error);
  if (error instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid Json format. Please check your request",
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error?.message || "Unknown errror occurred.",
  });
};
