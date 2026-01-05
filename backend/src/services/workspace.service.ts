import UserModel from "../models/user.model.js";
import RoleModel from "../models/roles-permission.model.js";
import { NotFoundException } from "../utils/appError.js";
import { Roles } from "../enums/role.enum.js";
import WorkspaceModel from "../models/workspace.model.js";
import MemberModel from "../models/member.model.js";
import mongoose from "mongoose";
import TaskModel from "../models/task.model.js";
import { TaskStatusEnum } from "../enums/task.enum.js";
import { getIO } from "../socket.js";
export const createWorkspaceService = async (
  userId: string,
  body: {
    name: string;
    description?: string | undefined;
  }
) => {
  const { name, description } = body;
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const ownerRole = await RoleModel.findOne({ name: Roles.OWNER });
  if (!ownerRole) {
    throw new NotFoundException("Owner role not found");
  }

  const workspace = new WorkspaceModel({
    name: name,
    description: description,
    owner: user._id,
  });

  await workspace.save();

  const member = new MemberModel({
    userId: user._id,
    workspaceId: workspace._id,
    role: ownerRole._id,
    joinedAt: new Date(),
  });
  await member.save();

  user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
  await user.save();
  return {
    workspace,
  };
};

export const getAllWorkspacesUserIsMemberService = async (userId: string) => {
  const memberships = await MemberModel.find({ userId })
    .populate("workspaceId")
    .select("-password")
    .exec();

  const workspaces = memberships.map((membership) => membership.workspaceId);

  return { workspaces };
};

export const updateWorkspaceService = async (
  workspaceId: string,
  name: string,
  description?: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  workspace.name = name;
  workspace.description = description || "";
  await workspace.save();

  return { workspace };
};

export const getWorkspaceByIdService = async (workspaceId: string) => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const members = await MemberModel.find({
    workspaceId,
  }).populate("role");

  const workspaceWithMembers = {
    ...workspace.toObject(),
    members,
  };

  return {
    workspace: workspaceWithMembers,
  };
};

export const getWorkspaceMembersService = async (workspaceId: string) => {
  // Fetch all members of the workspace

  const members = await MemberModel.find({
    workspaceId,
  })
    .populate("userId", "name email profilePicture -password")
    .populate("role", "name");

  const roles = await RoleModel.find({}, { name: 1, _id: 1 })
    .select("-permission")
    .lean();

  return { members, roles };
};

export const getWorkspaceAnalyticsService = async (workspaceId: string) => {
  const currentDate = new Date();

  const totalTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
  });

  const overdueTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    dueDate: { $lt: currentDate },
    status: { $ne: TaskStatusEnum.DONE },
  });

  const completedTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    status: TaskStatusEnum.DONE,
  });

  const analytics = {
    totalTasks,
    overdueTasks,
    completedTasks,
  };

  // Last 7 Days of Completed Tasks
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const last7DaysMetrics = await TaskModel.aggregate([
    {
      $match: {
        workspace: new mongoose.Types.ObjectId(workspaceId),
        status: TaskStatusEnum.DONE,
        updatedAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Priority Distribution
  const priorityMetrics = await TaskModel.aggregate([
    {
      $match: {
        workspace: new mongoose.Types.ObjectId(workspaceId),
      },
    },
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  // Format the data for the frontend
  const last7Days = last7DaysMetrics.map((item) => ({
    date: item._id,
    count: item.count,
  }));

  const taskPriorityDistribution = {
    low: 0,
    medium: 0,
    high: 0,
  };

  priorityMetrics.forEach((metric) => {
    // Check if metric._id is valid before accessing property
    if (metric._id && typeof metric._id === 'string') {
      const key = metric._id.toLowerCase() as keyof typeof taskPriorityDistribution;
      if (taskPriorityDistribution[key] !== undefined) {
        taskPriorityDistribution[key] = metric.count;
      }
    }
  });

  return {
    analytics: {
      ...analytics,
      last7Days,
      taskPriorityDistribution,
    },
  };
};

export const changeMemberRoleService = async (
  workspaceId: string,
  memberId: string,
  roleId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const role = await RoleModel.findById(roleId);
  if (!role) {
    throw new NotFoundException("Role not found");
  }

  const member = await MemberModel.findOne({
    userId: memberId,
    workspaceId: workspaceId,
  });

  if (!member) {
    throw new Error("Member not found in the workspace");
  }

  member.role = role;
  await member.save();

  return {
    member,
  };
};

export const deleteMemberFromWorkspaceService = async (
  workspaceId: string,
  memberId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const member = await MemberModel.findOne({
    userId: memberId,
    workspaceId: workspaceId,
  });

  if (!member) {
    throw new Error("Member not found in the workspace");
  }

  const role = await RoleModel.findById(member.role);
  if (role?.name === Roles.OWNER) {
    throw new Error("Cannot remove the owner of the workspace");
  }

  await MemberModel.deleteOne({
    userId: memberId,
    workspaceId: workspaceId,
  });

  const io = getIO();
  io.to(workspaceId).emit("member_removed", { memberId, userId: memberId });

  return { message: "Member removed successfully" };
};
