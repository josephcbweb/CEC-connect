import "dotenv/config";
import { prisma } from "../lib/prisma";

/**
 * Cleanup script: Deletes all permissions from the database that are NOT
 * in the current seed-permission.ts list. Also removes their RolePermission
 * associations first to avoid FK constraint errors.
 */

// These are the permissions that SHOULD exist (from seed-permission.ts)
const VALID_PERMISSIONS = [
  "view_dashboard",
  "view_students",
  "create_students",
  "update_students",
  "delete_students",
  "view_certificates",
  "approve_certificates",
  "view_users",
  "manage_users",
  "view_roles",
  "manage_roles",
  "view_permissions",
  "manage_permissions",
  "view_settings",
  "manage_settings",
  "view:due",
  "view:admissions",
  "view:fee",
  "manage:due",
  "fee:create_structure",
  "fee:update_structure",
  "fee:delete_structure",
  "fee:assign",
  "fee:mark_paid",
  "admission:update_status",
  "admission:bulk_update",
  "admission:delete",
  "admission:manage_windows",
  "admission:assign_class",
  "admission:delete_stale",
  "due:create_config",
  "due:delete_config",
  "due:manage_service_dept",
  "due:bulk_initiate",
  "due:send_emails",
];

async function main() {
  console.log("🔍 Finding stale permissions...\n");

  const allPermissions = await prisma.permission.findMany({
    select: { id: true, name: true },
  });

  const stalePermissions = allPermissions.filter(
    (p) => !VALID_PERMISSIONS.includes(p.name),
  );

  if (stalePermissions.length === 0) {
    console.log("✅ No stale permissions found. Database is clean.");
    return;
  }

  console.log(`Found ${stalePermissions.length} stale permission(s):`);
  stalePermissions.forEach((p) => console.log(`  - ${p.name} (id: ${p.id})`));

  const staleIds = stalePermissions.map((p) => p.id);

  // 1. Remove RolePermission associations
  const deletedAssociations = await prisma.rolePermission.deleteMany({
    where: { permissionId: { in: staleIds } },
  });
  console.log(
    `\n🔗 Removed ${deletedAssociations.count} role-permission association(s).`,
  );

  // 2. Delete the stale permissions
  const deletedPermissions = await prisma.permission.deleteMany({
    where: { id: { in: staleIds } },
  });
  console.log(`🗑️  Deleted ${deletedPermissions.count} stale permission(s).`);

  console.log("\n✅ Cleanup complete!");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
