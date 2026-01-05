import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { HTTPSTATUS } from "../config/http.config.js";
import ChatModel from "../models/chat.model.js";

export const getWorkspaceChatHistoryController = asyncHandler(
    async (req: Request, res: Response) => {
        const { workspaceId } = req.params;

        const messages = await ChatModel.find({ workspaceId })
            .populate("senderId", "name profilePicture")
            .sort({ createdAt: 1 }); // Oldest first

        res.status(HTTPSTATUS.OK).json({
            message: "Chat history fetched successfully",
            messages,
        });
    }
);
