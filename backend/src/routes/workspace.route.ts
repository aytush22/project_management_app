import { Router } from "express";
import { createWorkspaceController } from "../controllers/workspace.controller.js";
import { getAllWorkspacesUserIsMemberController } from "../controllers/workspace.controller.js";
import { getWorkspaceByIdController } from "../controllers/workspace.controller.js";
import { getWorkspaceMembersController } from "../controllers/workspace.controller.js";
import { getWorkspaceAnalyticsController } from "../controllers/workspace.controller.js";
import { changeWorkspaceMemberRoleController } from "../controllers/workspace.controller.js";
const workspaceRoutes = Router();

workspaceRoutes.post("/create/new", createWorkspaceController);

workspaceRoutes.put(
  "/change/member/role/:id",
  changeWorkspaceMemberRoleController
);

workspaceRoutes.get("/all", getAllWorkspacesUserIsMemberController);
workspaceRoutes.get("/members/:id", getWorkspaceMembersController);
workspaceRoutes.get("/:id", getWorkspaceByIdController);
workspaceRoutes.get("/analytics/:id", getWorkspaceAnalyticsController);
export default workspaceRoutes;
