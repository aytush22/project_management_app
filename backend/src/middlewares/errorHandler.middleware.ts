import type { ErrorRequestHandler } from "express";
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
  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error?.message || "Unknown errror occurred.",
  });
};
