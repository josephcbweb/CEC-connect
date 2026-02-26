"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const prisma_1 = require("../lib/prisma"); // Adjust this path if needed based on your folder structure
// ---------- Prisma setup ----------
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment variables");
}
// ---------- Main seed ----------
function main() {
    return __awaiter(this, void 0, void 0, function* () {
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
        ];
        const roleMap = {};
        for (const r of roles) {
            const role = yield prisma_1.prisma.role.upsert({
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
            // Fees & Certificates
            { name: "view_fees", moduleName: "fees", action: "read" },
            { name: "manage_fees", moduleName: "fees", action: "manage" },
            { name: "view_certificates", moduleName: "certificates", action: "read" },
            { name: "approve_certificates", moduleName: "certificates", action: "approve" },
            // System Administration
            { name: "view_users", moduleName: "users", action: "read" },
            { name: "manage_users", moduleName: "users", action: "manage" },
            { name: "view_roles", moduleName: "roles", action: "read" },
            { name: "manage_roles", moduleName: "roles", action: "manage" },
            { name: "view_permissions", moduleName: "permissions", action: "read" },
            { name: "manage_permissions", moduleName: "permissions", action: "manage" },
            { name: "view_settings", moduleName: "settings", action: "read" },
            { name: "manage_settings", moduleName: "settings", action: "manage" },
            // Courses & Dues
            { name: "course:manage", moduleName: "course", action: "manage" },
            { name: "nodue:request", moduleName: "nodue", action: "request" },
            { name: "librarydue:view", moduleName: "librarydue", action: "view" },
            { name: "librarydue:approve", moduleName: "librarydue", action: "approve" },
            { name: "accountsdue:view", moduleName: "accountsdue", action: "view" },
            { name: "accountsdue:approve", moduleName: "accountsdue", action: "approve" },
            { name: "hosteldue:view", moduleName: "hosteldue", action: "view" },
            { name: "hosteldue:approve", moduleName: "hosteldue", action: "approve" },
            { name: "labdue:view", moduleName: "labdue", action: "view" },
            { name: "labdue:approve", moduleName: "labdue", action: "approve" },
        ];
        const permMap = {};
        for (const p of permissions) {
            const perm = yield prisma_1.prisma.permission.upsert({
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
            // Student
            { role: "student", perms: ["nodue:request"] },
            // Library Staff
            { role: "library_staff", perms: ["librarydue:view", "librarydue:approve"] },
            // Accounts Staff
            { role: "accounts_staff", perms: ["accountsdue:view", "accountsdue:approve"] },
            // Hostel Warden
            { role: "hostel_warden", perms: ["hosteldue:view", "hosteldue:approve"] },
        ];
        for (const rp of rolePermissions) {
            const roleId = roleMap[rp.role];
            if (!roleId) {
                console.warn(`Role ${rp.role} not found, skipping permission assignment.`);
                continue;
            }
            for (const permName of rp.perms) {
                const permId = permMap[permName];
                if (permId) {
                    yield prisma_1.prisma.rolePermission.upsert({
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
    });
}
// ---------- Run ----------
main()
    .catch((e) => {
    console.error("❌ An error occurred during the seeding process:", e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.$disconnect();
}));
