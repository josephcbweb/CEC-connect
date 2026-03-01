import { useState, useEffect, useMemo } from "react";

interface UsePermissionsReturn {
  /** Whether the user has the admin role (always gets full access) */
  isAdmin: boolean;
  /** Array of permission strings the user has */
  permissions: string[];
  /** Check if user has a specific permission (admin always returns true) */
  hasPermission: (permission: string) => boolean;
  /** Check if user has ANY of the given permissions (admin always returns true) */
  hasAnyPermission: (permissions: string[]) => boolean;
  /** The user's role names */
  roles: string[];
}

/**
 * Hook to check user permissions from localStorage.
 * Admin role always returns true for all permission checks.
 */
export function usePermissions(): UsePermissionsReturn {
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        const userRoles = Array.isArray(user.role)
          ? user.role.map((r: string) => r.toLowerCase())
          : [user.role?.toLowerCase() || "guest"];
        const userPerms = Array.isArray(user.permission) ? user.permission : [];
        setRoles(userRoles);
        setPermissions(userPerms);
      } catch {
        setRoles([]);
        setPermissions([]);
      }
    }
  }, []);

  const isAdmin = useMemo(
    () => roles.includes("admin") || roles.includes("super admin"),
    [roles],
  );

  const hasPermission = useMemo(
    () => (permission: string) => {
      if (isAdmin) return true;
      return permissions.includes(permission);
    },
    [isAdmin, permissions],
  );

  const hasAnyPermission = useMemo(
    () => (perms: string[]) => {
      if (isAdmin) return true;
      return perms.some((p) => permissions.includes(p));
    },
    [isAdmin, permissions],
  );

  return { isAdmin, permissions, hasPermission, hasAnyPermission, roles };
}
