import UserModel from "../models/user.model.js";
import { BadRequestException } from "../utils/appError.js";
export const getCurrentUserService = async (userId: string) => {
  const user = await UserModel.findById(userId)
    .populate("currentWorkspace")
    .select("-password");
  if (!user) {
    throw new BadRequestException("User not found");
  }

  return { user };
};
