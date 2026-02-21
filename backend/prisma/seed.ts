import "dotenv/config";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { prisma } from "../lib/prisma";

// ---------- Prisma setup ----------

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// ---------- Helpers ----------

// Helper function to correctly parse dates like "DD/MM/YYYY"
function parseCustomDate(dateString?: string | null): Date | null {
  if (!dateString || dateString.trim() === "") return null;
  const parts = dateString.split("/");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

// Wrap CSV reading into a Promise so we can await it
async function readStudentsFromCsv(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => resolve(rows))
      .on("error", (err) => reject(err));
  });
}

// ---------- Main seed ----------

async function main(): Promise<void> {
  console.log("🌱 Starting the seeding process...");

  // 1. Clean up existing data to ensure a fresh start
  console.log("🧹 Clearing previous data...");
  // Delete in order to avoid foreign key constraints
  await prisma.courseSelection.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.noDueApproval.deleteMany({});
  await prisma.noDue.deleteMany({});
  await prisma.noDueRequest.deleteMany({});

  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.role.deleteMany({});

  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.feeDetails.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.hodDetails.deleteMany({});
  await prisma.advisorDetails.deleteMany({});
  await prisma.serviceDepartment.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Service Departments
  console.log("🏢 Creating service departments...");
  const serviceDepartments = [
    { name: "Library", code: "LIB" },
    { name: "Accounts", code: "ACC" },
    { name: "Hostel", code: "HST" },
  ];

  for (const dept of serviceDepartments) {
    await prisma.serviceDepartment.upsert({
      where: { name: dept.name },
      update: { code: dept.code },
      create: { name: dept.name, code: dept.code },
    });
  }

  // 2.1 Create Academic Departments (if not exists)
  console.log("🏢 Creating academic departments...");
  const academicDepartments = [
    { name: "Computer Science", code: "CSE" },
    { name: "Electronics and Communication", code: "ECE" },
    { name: "Electrical and Electronics", code: "EEE" },
    { name: "Artificial Intelligence", code: "AD" },
  ];

  for (const dept of academicDepartments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: { department_code: dept.code },
      create: { name: dept.name, department_code: dept.code },
    });
  }

  // 3. Create Roles
  console.log("busts Creating roles...");
  const roles = [
    { name: "admin", description: "Administrator" },
    { name: "student", description: "Student" },
    { name: "library_staff", description: "Library Staff" },
    { name: "accounts_staff", description: "Accounts Staff" },
    { name: "hostel_warden", description: "Hostel Warden" },
    { name: "hod", description: "Head of Department" },
  ];

  const roleMap: Record<string, number> = {};

  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    roleMap[r.name] = role.id;
  }

  // 4. Create Permissions
  console.log("🔑 Creating permissions...");
  const permissions = [
    // Existing permissions (kept for compatibility)
    { name: "view_dashboard", moduleName: "dashboard", action: "read" },
    { name: "view_students", moduleName: "students", action: "read" },
    { name: "create_students", moduleName: "students", action: "create" },
    { name: "update_students", moduleName: "students", action: "update" },
    { name: "delete_students", moduleName: "students", action: "delete" },
    { name: "view_fees", moduleName: "fees", action: "read" },
    { name: "manage_fees", moduleName: "fees", action: "manage" },
    { name: "view_certificates", moduleName: "certificates", action: "read" },
    {
      name: "approve_certificates",
      moduleName: "certificates",
      action: "approve",
    },
    { name: "view_users", moduleName: "users", action: "read" },
    { name: "manage_users", moduleName: "users", action: "manage" },
    { name: "view_roles", moduleName: "roles", action: "read" },
    { name: "manage_roles", moduleName: "roles", action: "manage" },
    { name: "view_permissions", moduleName: "permissions", action: "read" },
    { name: "manage_permissions", moduleName: "permissions", action: "manage" },
    { name: "view_settings", moduleName: "settings", action: "read" },
    { name: "manage_settings", moduleName: "settings", action: "manage" },

    // New Permissions
    { name: "course:manage", moduleName: "course", action: "manage" },
    { name: "nodue:request", moduleName: "nodue", action: "request" },
    { name: "librarydue:view", moduleName: "librarydue", action: "view" },
    { name: "librarydue:approve", moduleName: "librarydue", action: "approve" },
    { name: "accountsdue:view", moduleName: "accountsdue", action: "view" },
    {
      name: "accountsdue:approve",
      moduleName: "accountsdue",
      action: "approve",
    },
    { name: "hosteldue:view", moduleName: "hosteldue", action: "view" },
    { name: "hosteldue:approve", moduleName: "hosteldue", action: "approve" },
    { name: "labdue:view", moduleName: "labdue", action: "view" },
    { name: "labdue:approve", moduleName: "labdue", action: "approve" },
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

  // 5. Assign Permissions to Roles
  console.log("🔗 Assigning permissions to roles...");

  const rolePermissions = [
    // Admin: All permissions
    { role: "admin", perms: Object.keys(permMap) },

    // Student
    { role: "student", perms: ["nodue:request"] },

    // Library Staff
    { role: "library_staff", perms: ["librarydue:view", "librarydue:approve"] },

    // Accounts Staff
    {
      role: "accounts_staff",
      perms: ["accountsdue:view", "accountsdue:approve"],
    },

    // Hostel Warden
    { role: "hostel_warden", perms: ["hosteldue:view", "hosteldue:approve"] },
  ];

  for (const rp of rolePermissions) {
    const roleId = roleMap[rp.role];
    if (!roleId) continue;

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

  // 6. Create Admin User
  console.log("👤 Creating admin user...");
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("admin123", salt);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@cec-connect.com",
      passwordHash: adminPasswordHash,
      userRoles: {
        create: { roleId: roleMap["admin"] },
      },
    },
  });

  // 7. Create Staff Users (for testing)
  const staffUsers = [
    { username: "librarian", email: "lib@cec.com", role: "library_staff" },
    { username: "accountant", email: "acc@cec.com", role: "accounts_staff" },
    { username: "warden", email: "warden@cec.com", role: "hostel_warden" },
  ];

  for (const staff of staffUsers) {
    await prisma.user.upsert({
      where: { username: staff.username },
      update: {},
      create: {
        username: staff.username,
        email: staff.email,
        passwordHash: adminPasswordHash, // same password for simplicity
        userRoles: {
          create: { roleId: roleMap[staff.role] },
        },
      },
    });
  }

  // 8. Import Students from CSV
  const filePath = path.join(__dirname, "..", "btech-students.csv");
  if (fs.existsSync(filePath)) {
    console.log("🎓 Reading students from CSV file...");
    const studentsFromCsv = await readStudentsFromCsv(filePath);
    console.log(
      `✅ CSV file processed. Found ${studentsFromCsv.length} students.`
    );

    let successCount = 0;
    let errorCount = 0;

    for (const row of studentsFromCsv) {
      try {
        const departmentName = row.allottedBranch?.toLowerCase();
        if (!departmentName) {
          continue;
        }

        // Map CSV branch names to our standard departments
        let targetDeptName = "Computer Science"; // Default
        const branch = row.allottedBranch.toString().toLowerCase();

        if (branch.includes("ai")) {
          targetDeptName = "Artificial Intelligence";
        } else if (branch.includes("computer") || branch.includes("cse")) {
          targetDeptName = "Computer Science";
        } else if (branch.includes("electrical")) {
          targetDeptName = "Electrical and Electronics";
        } else if (branch.includes("electronics")) {
          targetDeptName = "Electronics and Communication";
        }

        const department = await prisma.department.findFirst({
          where: { name: targetDeptName },
        });

        if (!department) {
          console.warn(
            `Department not found for branch: ${branch}, mapped to ${targetDeptName}`
          );
          continue;
        }

        // --- Required enum-ish fields fallbacks ---
        const rawGender = (row.gender || "").toString().toLowerCase();
        const genderFallback =
          rawGender === "female"
            ? "female"
            : rawGender === "other"
              ? "other"
              : "male";

        const programFallback = (row.program || "btech")
          .toString()
          .toLowerCase();
        const statusFallback = (row.status || "approved")
          .toString()
          .toLowerCase();
        const admissionTypeFallback = (row.admissionType || "regular")
          .toString()
          .toLowerCase();

        const fallbackPhone =
          row.studentPhoneNumber ||
          `99999999${successCount.toString().padStart(2, "0")}`;

        const fallbackAadhaar =
          row.aadhaarNumber ||
          `FAKE-AADHAAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const fallbackQualExamRegNo =
          row.qualifyingExamRegisterNo ||
          `UNKNOWN-${row.admissionNumber || successCount}`;

        const studentData: any = {
          department: {
            connect: { id: department.id },
          },
          name: row.name || "Unknown Student",
          password:
            "$2a$10$Cvpbg91lGoW83LCUlOTaO.sqclvlvYiAxTnO5e1yLmMXX.MM4q.Uy",
          gender: genderFallback,
          religion: row.religion || "Not specified",
          mother_tongue: row.motherTongue || "Malayalam",
          student_phone_number: fallbackPhone,
          permanent_address:
            row.permanentAddress || "Permanent address not provided",
          contact_address:
            row.contactAddress ||
            row.permanentAddress ||
            "Contact address not provided",
          state_of_residence: row.stateOfResidence || "Kerala",
          aadhaar_number: fallbackAadhaar,
          program: programFallback,
          status: statusFallback,
          admission_type: admissionTypeFallback,
          allotted_branch: row.allottedBranch || departmentName,
          last_institution: row.lastInstitution || "Unknown institution",
          qualifying_exam_name: row.qualifyingExamName || "Unknown exam",
          qualifying_exam_register_no: fallbackQualExamRegNo,
          dateOfBirth: parseCustomDate(row.dateOfBirth),
          email: row.studentEmail || null,
          nationality: row.nationality || "Indian",
          blood_group: row.bloodGroup || null,
          fatherName: row.fatherName || null,
          father_phone_number: row.fatherPhoneNumber || null,
          motherName: row.motherName || null,
          mother_phone_number: row.motherPhoneNumber || null,
          parent_email: row.parentEmail || null,
          annual_family_income: row.annualFamilyIncome
            ? parseFloat(row.annualFamilyIncome)
            : null,
          guardian_name: row.guardianName || null,
          guardian_relationship: row.guardianRelationship || null,
          guardian_email: row.guardianEmail || null,
          local_guardian_address: row.localGuardianAddress || null,
          local_guardian_phone_number: row.localGuardianPhoneNumber || null,
          admission_number: row.admissionNumber || null,
          admission_date: parseCustomDate(row.admissionDate),
          category: row.category?.toLowerCase() || null,
          is_fee_concession_eligible:
            row.isFeeConcessionEligible?.toString().toLowerCase() === "true",
          tc_number: row.tcNumber || null,
          tc_date: parseCustomDate(row.tcDate),
          percentage: row.percentage ? parseFloat(row.percentage) : null,
          previous_degree_cgpa_or_total_marks:
            row.previousDegreeCgpaOrTotalMarks
              ? parseFloat(row.previousDegreeCgpaOrTotalMarks)
              : null,
          physics_score: row.physicsScore ? parseFloat(row.physicsScore) : null,
          chemistry_score: row.chemistryScore
            ? parseFloat(row.chemistryScore)
            : null,
          maths_score: row.mathsScore ? parseFloat(row.mathsScore) : null,
          keam_subject_total: row.keamSubjectTotal
            ? parseFloat(row.keamSubjectTotal)
            : null,
          entrance_type: row.entranceType || null,
          entrance_roll_no: row.entranceRollNo || null,
          entrance_rank: row.entranceRank
            ? parseInt(row.entranceRank, 10)
            : null,
          entrance_total_score: row.entranceTotalScore
            ? parseFloat(row.entranceTotalScore)
            : null,
          account_number: row.accountNumber || null,
          bank_name: row.bankName || null,
          ifsc_code: row.ifscCode || null,
          bank_branch: row.bankBranch || null,
          admitted_category: row.admittedCategory || null,
        };

        await prisma.student.create({ data: studentData });
        successCount++;
      } catch (e: any) {
        errorCount++;
        console.error(`❌ Error processing student "${row.name}":`, e.message);
      }
    }
    console.log(
      `\n✨ Import complete. Success: ${successCount}, Failures: ${errorCount}`
    );
  } else {
    console.log("⚠️ CSV file not found, skipping student import.");
  }
}

// ---------- Run ----------

main()
  .catch((e) => {
    console.error("An error occurred during the seeding process:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
