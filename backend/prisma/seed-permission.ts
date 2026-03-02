import "dotenv/config";
import { prisma } from "../lib/prisma"; // Adjust this path if needed based on your folder structure

// ---------- Prisma setup ----------

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// ---------- Main seed ----------

async function main(): Promise<void> {
  console.log("🌱 Starting the Roles & Permissions seeding process...");

  // Optional: Clean up existing roles/permissions data
  // Uncomment these lines if you want a completely fresh start for roles/permissions
  /*
    console.log("🧹 Clearing previous roles and permissions data...");
    await prisma.rolePermission.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.userRole.deleteMany({}); // Only if you want to wipe user assignments
    await prisma.role.deleteMany({});
    */

  // 1. Create Roles
  console.log("👥 Creating roles...");
  const roles = [
    { name: "admin", description: "Administrator" },
    { name: "student", description: "Student" },
    { name: "library_staff", description: "Library Staff" },
    { name: "accounts_staff", description: "Accounts Staff" },
    { name: "hostel_warden", description: "Hostel Warden" },
    { name: "hod", description: "Head of Department" },
    { name: "staff_advisor", description: "Staff Advisor" },
  ];

  const roleMap: Record<string, number> = {};

  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {}, // Don't overwrite existing descriptions if they already exist
      create: r,
    });
    roleMap[r.name] = role.id;
  }

  // 2. Create Permissions
  console.log("🔑 Creating permissions...");
  const permissions = [
    // Dashboard & Students
    { name: "view_dashboard", moduleName: "dashboard", action: "read" },
    { name: "view_students", moduleName: "students", action: "read" },
    { name: "create_students", moduleName: "students", action: "create" },
    { name: "update_students", moduleName: "students", action: "update" },
    { name: "delete_students", moduleName: "students", action: "delete" },

    // Certificates
    { name: "view_certificates", moduleName: "certificates", action: "read" },
    {
      name: "approve_certificates",
      moduleName: "certificates",
      action: "approve",
    },

    // System Administration
    { name: "view_users", moduleName: "users", action: "read" },
    { name: "manage_users", moduleName: "users", action: "manage" },
    { name: "view_roles", moduleName: "roles", action: "read" },
    { name: "manage_roles", moduleName: "roles", action: "manage" },
    { name: "view_permissions", moduleName: "permissions", action: "read" },
    { name: "manage_permissions", moduleName: "permissions", action: "manage" },
    { name: "view_settings", moduleName: "settings", action: "read" },
    { name: "manage_settings", moduleName: "settings", action: "manage" },

    // Sidebar Section Permissions
    { name: "view:certificates", moduleName: "sidebar", action: "view" },
    { name: "view:due", moduleName: "sidebar", action: "view" },
    { name: "view:admissions", moduleName: "sidebar", action: "view" },
    { name: "view:fee", moduleName: "sidebar", action: "view" },
    { name: "manage:due", moduleName: "dues", action: "manage" },

    // Fee Management Permissions
    { name: "fee:create_structure", moduleName: "fees", action: "create" },
    { name: "fee:update_structure", moduleName: "fees", action: "update" },
    { name: "fee:delete_structure", moduleName: "fees", action: "delete" },
    { name: "fee:assign", moduleName: "fees", action: "assign" },
    { name: "fee:mark_paid", moduleName: "fees", action: "update" },

    // Admission Management Permissions
    {
      name: "admission:update_status",
      moduleName: "admissions",
      action: "update",
    },
    {
      name: "admission:bulk_update",
      moduleName: "admissions",
      action: "update",
    },
    { name: "admission:delete", moduleName: "admissions", action: "delete" },
    {
      name: "admission:manage_windows",
      moduleName: "admissions",
      action: "manage",
    },
    {
      name: "admission:assign_class",
      moduleName: "admissions",
      action: "assign",
    },
    {
      name: "admission:delete_stale",
      moduleName: "admissions",
      action: "delete",
    },

    // Due Settings Permissions
    { name: "due:create_config", moduleName: "dues", action: "create" },
    { name: "due:delete_config", moduleName: "dues", action: "delete" },
    { name: "due:manage_service_dept", moduleName: "dues", action: "manage" },
    { name: "due:bulk_initiate", moduleName: "dues", action: "manage" },
    { name: "due:send_emails", moduleName: "dues", action: "manage" },

    // Analytics & Audit (admin-only)
    { name: "view:analytics", moduleName: "sidebar", action: "view" },
    { name: "view:audit_logs", moduleName: "sidebar", action: "view" },
  ];

  const permMap: Record<string, number> = {};

  for (const p of permissions) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: {
        name: p.name,
        moduleName: p.moduleName,
        action: p.action,
        description: `${p.action} ${p.moduleName}`,
      },
    });
    permMap[p.name] = perm.id;
  }

  // 3. Assign Permissions to Roles
  console.log("🔗 Assigning permissions to roles...");

  const rolePermissions = [
    // Admin: All permissions
    { role: "admin", perms: Object.keys(permMap) },

    // Library Staff
    {
      role: "library_staff",
      perms: ["view:due"],
    },

    // Accounts Staff - can view fees, mark paid, view dues
    {
      role: "accounts_staff",
      perms: ["view:fee", "fee:mark_paid", "view:due"],
    },

    // Hostel Warden
    {
      role: "hostel_warden",
      perms: ["view:due"],
    },

    // Head of Department
    {
      role: "hod",
      perms: ["view:certificates"],
    },

    // Staff Advisor
    {
      role: "staff_advisor",
      perms: ["view:certificates"],
    },
  ];

  for (const rp of rolePermissions) {
    const roleId = roleMap[rp.role];
    if (!roleId) {
      console.warn(
        `Role ${rp.role} not found, skipping permission assignment.`,
      );
      continue;
    }

    for (const permName of rp.perms) {
      const permId = permMap[permName];
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId: permId },
          },
          update: {},
          create: { roleId, permissionId: permId },
        });
      }
    }
  }

  console.log("✅ Roles and Permissions seeded successfully!");
}

// ---------- Run ----------

main()
  .catch((e) => {
    console.error("❌ An error occurred during the seeding process:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
