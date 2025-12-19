import mongoose from "mongoose";
import "dotenv/config";
import RoleModel from "../models/roles-permission.model.js";
import { RolePermissions } from "../utils/role-permission.js";
import connectDatabase from "../config/database.config.js";
const seedRoles = async () => {
  console.log("Seeding roles started....");
  try {
    await connectDatabase();
    const session = await mongoose.startSession();
    session.startTransaction();
    console.log("Clearing existing roles in the db....");
    await RoleModel.deleteMany({}, { session });
    for (const roleName in RolePermissions) {
      const role = roleName as keyof typeof RolePermissions;
      const permissions = RolePermissions[role];
      //if role exists
      const existingRole = await RoleModel.findOne({ name: role }).session(
        session
      );
      if (!existingRole) {
        const newRole = new RoleModel({
          name: role,
          permissions: permissions,
        });
        await newRole.save({ session });
        console.log(`Role ${role} added with permissions.`);
      } else {
        console.log(`Role ${role} already exists.`);
      }
    }
    await session.commitTransaction();
    console.log("Transaction committed.");
    session.endSession();
    console.log("Session ended.");
    console.log("Seeding completed in the db.");
  } catch (error) {
    console.error("Error during seeding: ", error);
  }
};

seedRoles().catch((error) =>
  console.error("Error running seed script: ", error)
);
