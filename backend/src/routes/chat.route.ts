import { Router } from "express";
import { getWorkspaceChatHistoryController } from "../controllers/chat.controller.js";

const chatRoutes = Router();

chatRoutes.get("/:workspaceId/messages", getWorkspaceChatHistoryController);

export default chatRoutes;
