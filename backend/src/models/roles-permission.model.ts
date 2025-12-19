import mongoose, { Schema, Document } from "mongoose";
import type { RoleType, PermissionType } from "../enums/role.enum.js";
import { Roles, Permissions } from "../enums/role.enum.js";
import { RolePermissions } from "../utils/role-permission.js";
export interface RoleDocument extends Document {
  name: RoleType;
  permissions: Array<PermissionType>;
}

const roleSchema = new Schema<RoleDocument>(
  {
    name: {
      type: String,
      enum: Object.values(Roles),
      unique: true,
    },
    permissions: {
      type: [String],
      enum: Object.values(Permissions),
      required: true,
      default: function (this: RoleDocument) {
        return RolePermissions[this.name];
      },
    },
  },
  { timestamps: true }
);
const RoleModel = mongoose.model<RoleDocument>("Roles", roleSchema);
export default RoleModel;
