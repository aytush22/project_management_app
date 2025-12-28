import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { HTTPSTATUS } from "../config/http.config.js";
import { getCurrentUserService } from "../services/user.service.js";
import type { Request, Response } from "express";
export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { user } = await getCurrentUserService(userId);
    return res.status(HTTPSTATUS.OK).json({
      message: "User fetch successfully",
      user,
    });
  }
);


