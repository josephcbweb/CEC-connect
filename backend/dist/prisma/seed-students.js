"use strict";
// import "dotenv/config";
// import fs from "fs";
// import path from "path";
// import csv from "csv-parser";
// import bcrypt from "bcrypt";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { prisma } from "../lib/prisma";
// // ---------- Prisma setup ----------
// const connectionString = process.env.DATABASE_URL;
// if (!connectionString) {
//   throw new Error("DATABASE_URL is not set in environment variables");
// }
// // You were using this before; prisma from ../lib/prisma is already configured.
// // Keeping this here if you need low-level adapter access later:
// const adapter = new PrismaPg({ connectionString });
// // ---------- Helpers ----------
// // Helper function to correctly parse dates like "DD/MM/YYYY"
// function parseCustomDate(dateString?: string | null): Date | null {
//   if (!dateString || dateString.trim() === "") return null;
//   const parts = dateString.split("/");
//   if (parts.length !== 3) return null;
//   const day = parseInt(parts[0], 10);
//   const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
//   const year = parseInt(parts[2], 10);
//   const date = new Date(year, month, day);
//   return isNaN(date.getTime()) ? null : date;
// }
// // Wrap CSV reading into a Promise so we can await it
// async function readStudentsFromCsv(filePath: string): Promise<any[]> {
//   return new Promise((resolve, reject) => {
//     const rows: any[] = [];
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on("data", (row) => {
//         rows.push(row);
//       })
//       .on("end", () => resolve(rows))
//       .on("error", (err) => reject(err));
//   });
// }
// // ---------- Main seed ----------
// async function main(): Promise<void> {
//   console.log("🌱 Starting the seeding process...");
//   // 1. Clean up existing data to ensure a fresh start
//   console.log("🧹 Clearing previous data...");
//   await prisma.rolePermission.deleteMany({});
//   await prisma.permission.deleteMany({});
//   await prisma.userRole.deleteMany({});
//   await prisma.role.deleteMany({});
//   await prisma.noDueRequest.deleteMany({});
//   await prisma.feeDetails.deleteMany({});
//   await prisma.student.deleteMany({});
//   await prisma.hodDetails.deleteMany({});
//   await prisma.advisorDetails.deleteMany({});
//   await prisma.department.deleteMany({});
//   await prisma.user.deleteMany({});
//   // 2. Create Roles, Permissions, and Admin Users
//   console.log("🔐 Creating roles and admin users...");
//   const adminRole = await prisma.role.create({ data: { name: "admin" } });
//   const hodRole = await prisma.role.create({ data: { name: "hod" } });
//   const salt = await bcrypt.genSalt(10);
//   const adminPasswordHash = await bcrypt.hash("admin123", salt);
//   const adminUser = await prisma.user.create({
//     data: {
//       username: "admin",
//       email: "admin@cec-connect.com",
//       passwordHash: adminPasswordHash,
//       userRoles: {
//         create: { roleId: adminRole.id },
//       },
//     },
//   });
//   console.log("✅ Admin user and roles created:", adminUser.username);
//   // In your seed.ts, after creating roles
//   // Add these permissions
//   console.log("🔑 Creating permissions...");
//   const permissions = [
//     // Dashboard permissions
//     {
//       name: "view_dashboard",
//       moduleName: "dashboard",
//       action: "read",
//       description: "View dashboard",
//     },
//     // Student permissions
//     {
//       name: "view_students",
//       moduleName: "students",
//       action: "read",
//       description: "View students",
//     },
//     {
//       name: "create_students",
//       moduleName: "students",
//       action: "create",
//       description: "Create students",
//     },
//     {
//       name: "update_students",
//       moduleName: "students",
//       action: "update",
//       description: "Update students",
//     },
//     {
//       name: "delete_students",
//       moduleName: "students",
//       action: "delete",
//       description: "Delete students",
//     },
//     // Fee permissions
//     {
//       name: "view_fees",
//       moduleName: "fees",
//       action: "read",
//       description: "View fees",
//     },
//     {
//       name: "manage_fees",
//       moduleName: "fees",
//       action: "manage",
//       description: "Manage fees",
//     },
//     // Certificate permissions
//     {
//       name: "view_certificates",
//       moduleName: "certificates",
//       action: "read",
//       description: "View certificates",
//     },
//     {
//       name: "approve_certificates",
//       moduleName: "certificates",
//       action: "approve",
//       description: "Approve certificates",
//     },
//     // User/Role permissions
//     {
//       name: "view_users",
//       moduleName: "users",
//       action: "read",
//       description: "View users",
//     },
//     {
//       name: "manage_users",
//       moduleName: "users",
//       action: "manage",
//       description: "Manage users",
//     },
//     {
//       name: "view_roles",
//       moduleName: "roles",
//       action: "read",
//       description: "View roles",
//     },
//     {
//       name: "manage_roles",
//       moduleName: "roles",
//       action: "manage",
//       description: "Manage roles",
//     },
//     {
//       name: "view_permissions",
//       moduleName: "permissions",
//       action: "read",
//       description: "View permissions",
//     },
//     {
//       name: "manage_permissions",
//       moduleName: "permissions",
//       action: "manage",
//       description: "Manage permissions",
//     },
//     // Settings permissions
//     {
//       name: "view_settings",
//       moduleName: "settings",
//       action: "read",
//       description: "View settings",
//     },
//     {
//       name: "manage_settings",
//       moduleName: "settings",
//       action: "manage",
//       description: "Manage settings",
//     },
//   ];
//   for (const perm of permissions) {
//     await prisma.permission.create({
//       data: perm,
//     });
//   }
//   // Assign all permissions to admin role
//   const allPermissions = await prisma.permission.findMany();
//   for (const perm of allPermissions) {
//     await prisma.rolePermission.create({
//       data: {
//         roleId: adminRole.id,
//         permissionId: perm.id,
//       },
//     });
//   }
//   console.log(`✅ Created ${permissions.length} permissions`);
//   // 3. Read all data from CSV into memory first
//   const filePath = path.join(__dirname, "..", "btech-students.csv");
//   console.log("🎓 Reading students from CSV file...");
//   const studentsFromCsv = await readStudentsFromCsv(filePath);
//   console.log(
//     `✅ CSV file processed. Found ${studentsFromCsv.length} students.`
//   );
//   let successCount = 0;
//   let errorCount = 0;
//   // 4. Process and insert each student record one by one
//   for (const row of studentsFromCsv) {
//     try {
//       const departmentName = row.allottedBranch?.toLowerCase();
//       if (!departmentName) {
//         console.warn(
//           `Skipping student "${row.name}" due to missing 'allottedBranch'.`
//         );
//         continue;
//       }
//       // --- Department mapping ---
//       let departmentCode: string;
//       const branch = row.allottedBranch.toString().toLowerCase();
//       console.log(branch);
//       if (branch.includes("ai")) {
//         departmentCode = "AD";
//       } else if (branch.includes("computer") || branch.includes("cse")) {
//         departmentCode = "CSE";
//       } else if (branch.includes("electrical")) {
//         departmentCode = "EEE";
//       } else {
//         departmentCode = "ECE";
//       }
//       const department = await prisma.department.upsert({
//         where: { name: departmentName },
//         update: {},
//         create: { name: departmentName, department_code: departmentCode },
//       });
//       // --- Required enum-ish fields fallbacks ---
//       // NOTE: Program / AdmissionStatus / AdmissionType are enums in Prisma.
//       // We pass strings but type studentData as `any` so TS won't complain.
//       const rawGender = (row.gender || "").toString().toLowerCase();
//       const genderFallback =
//         rawGender === "female"
//           ? "female"
//           : rawGender === "other"
//             ? "other"
//             : "male"; // default to 'male' if missing/invalid
//       const programFallback = (row.program || "btech").toString().toLowerCase();
//       const statusFallback = (row.status || "approved")
//         .toString()
//         .toLowerCase();
//       const admissionTypeFallback = (row.admissionType || "regular")
//         .toString()
//         .toLowerCase();
//       // --- Unique fallback helpers ---
//       const fallbackPhone =
//         row.studentPhoneNumber ||
//         `99999999${successCount.toString().padStart(2, "0")}`;
//       const fallbackAadhaar =
//         row.aadhaarNumber ||
//         `FAKE-AADHAAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
//       const fallbackQualExamRegNo =
//         row.qualifyingExamRegisterNo ||
//         `UNKNOWN-${row.admissionNumber || successCount}`;
//       // Prepare the complete student data object
//       // `any` so we don't fight Prisma's TS types for enums
//       const studentData: any = {
//         // relation
//         department: {
//           connect: { id: department.id },
//         },
//         // required fields with fallbacks
//         name: row.name || "Unknown Student",
//         password:
//           "$2a$10$Cvpbg91lGoW83LCUlOTaO.sqclvlvYiAxTnO5e1yLmMXX.MM4q.Uy", // default password hash
//         gender: genderFallback, // Gender enum
//         religion: row.religion || "Not specified",
//         mother_tongue: row.motherTongue || "Malayalam",
//         student_phone_number: fallbackPhone,
//         permanent_address:
//           row.permanentAddress || "Permanent address not provided",
//         contact_address:
//           row.contactAddress ||
//           row.permanentAddress ||
//           "Contact address not provided",
//         state_of_residence: row.stateOfResidence || "Kerala",
//         aadhaar_number: fallbackAadhaar,
//         program: programFallback, // Program enum
//         status: statusFallback, // AdmissionStatus enum
//         admission_type: admissionTypeFallback, // AdmissionType enum
//         allotted_branch: row.allottedBranch || departmentName,
//         last_institution: row.lastInstitution || "Unknown institution",
//         qualifying_exam_name: row.qualifyingExamName || "Unknown exam",
//         qualifying_exam_register_no: fallbackQualExamRegNo,
//         // optional / nullable fields
//         dateOfBirth: parseCustomDate(row.dateOfBirth),
//         email: row.studentEmail || null,
//         nationality: row.nationality || "Indian",
//         blood_group: row.bloodGroup || null,
//         fatherName: row.fatherName || null,
//         father_phone_number: row.fatherPhoneNumber || null,
//         motherName: row.motherName || null,
//         mother_phone_number: row.motherPhoneNumber || null,
//         parent_email: row.parentEmail || null,
//         annual_family_income: row.annualFamilyIncome
//           ? parseFloat(row.annualFamilyIncome)
//           : null,
//         guardian_name: row.guardianName || null,
//         guardian_relationship: row.guardianRelationship || null,
//         guardian_email: row.guardianEmail || null,
//         local_guardian_address: row.localGuardianAddress || null,
//         local_guardian_phone_number: row.localGuardianPhoneNumber || null,
//         admission_number: row.admissionNumber || null,
//         admission_date: parseCustomDate(row.admissionDate),
//         category: row.category?.toLowerCase() || null,
//         is_fee_concession_eligible:
//           row.isFeeConcessionEligible?.toString().toLowerCase() === "true",
//         tc_number: row.tcNumber || null,
//         tc_date: parseCustomDate(row.tcDate),
//         percentage: row.percentage ? parseFloat(row.percentage) : null,
//         previous_degree_cgpa_or_total_marks: row.previousDegreeCgpaOrTotalMarks
//           ? parseFloat(row.previousDegreeCgpaOrTotalMarks)
//           : null,
//         physics_score: row.physicsScore ? parseFloat(row.physicsScore) : null,
//         chemistry_score: row.chemistryScore
//           ? parseFloat(row.chemistryScore)
//           : null,
//         maths_score: row.mathsScore ? parseFloat(row.mathsScore) : null,
//         keam_subject_total: row.keamSubjectTotal
//           ? parseFloat(row.keamSubjectTotal)
//           : null,
//         entrance_type: row.entranceType || null,
//         entrance_roll_no: row.entranceRollNo || null,
//         entrance_rank: row.entranceRank ? parseInt(row.entranceRank, 10) : null,
//         entrance_total_score: row.entranceTotalScore
//           ? parseFloat(row.entranceTotalScore)
//           : null,
//         account_number: row.accountNumber || null,
//         bank_name: row.bankName || null,
//         ifsc_code: row.ifscCode || null,
//         bank_branch: row.bankBranch || null,
//         admitted_category: row.admittedCategory || null,
//       };
//       // await prisma.student.create({ data: studentData });
//       // successCount++;
//       // console.log(`--> Successfully inserted student record for ${row.name}`);
//     } catch (e: any) {
//       errorCount++;
//       console.error(`❌ Error processing student "${row.name}":`, e.message);
//     }
//   }
//   console.log(
//     `\n✨ Import complete. Success: ${successCount}, Failures: ${errorCount}`
//   );
// }
// // ---------- Run ----------
// main()
//   .catch((e) => {
//     console.error("An error occurred during the seeding process:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
