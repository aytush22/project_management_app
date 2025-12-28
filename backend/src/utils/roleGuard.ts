import type { PermissionType } from "../enums/role.enum.js";
import { Permissions } from "../enums/role.enum.js";
import { UnauthorizedException } from "./appError.js";
import { RolePermissions } from "./role-permission.js";

export const roleGuard = (
  role: keyof typeof RolePermissions,
  requiredPermissions: PermissionType[]
) => {
  const permissions = RolePermissions[role];

  const hasPermission = requiredPermissions.every((permission) =>
    permissions.includes(permission)
  );

  if (!hasPermission) {
    throw new UnauthorizedException(
      "You do not have the necessary permissions to perform this action"
    );
  }
};
