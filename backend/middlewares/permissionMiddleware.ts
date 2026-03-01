import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../utils/types";
import { prisma } from "../lib/prisma";

/**
 * Middleware that checks if the authenticated user has the required permission.
 * Admin role always passes. For other roles, the permission is checked against
 * the user's assigned role permissions in the database.
 *
 * Usage:  router.post("/", authenticate, requirePermission("fee:create_structure"), handler);
 */
export const requirePermission = (permissionName: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = req.user as { userId?: number } | undefined;
      if (!user?.userId) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      // Fetch user roles and permissions from DB
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!dbUser) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      // Check if user has admin role — admin always passes
      const roles = dbUser.userRoles.map((ur) => ur.role.name.toLowerCase());
      if (roles.includes("admin") || roles.includes("super admin")) {
        next();
        return;
      }

      // Check if user has the required permission
      const userPermissions = dbUser.userRoles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name),
      );

      if (userPermissions.includes(permissionName)) {
        next();
        return;
      }

      res
        .status(403)
        .json({ message: "You do not have permission to perform this action" });
    } catch (error) {
      console.error("Permission check failed:", error);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
};
