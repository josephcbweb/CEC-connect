const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcrypt");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const prisma = new PrismaClient();

// Helper function to correctly parse dates like "DD/MM/YYYY"
function parseCustomDate(dateString) {
  if (!dateString || dateString.trim() === "") return null;
  const parts = dateString.split("/");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const year = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

async function main() {
  console.log("🌱 Starting the seeding process...");

  // 1. Clean up existing data to ensure a fresh start
  console.log("🧹 Clearing previous data...");
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.noDueRequest.deleteMany({});
  await prisma.feeDetails.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.hodDetails.deleteMany({});
  await prisma.advisorDetails.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Roles, Permissions, and Admin Users
  console.log("🔐 Creating roles and admin users...");
  const adminRole = await prisma.role.create({ data: { name: "admin" } });
  const hodRole = await prisma.role.create({ data: { name: "hod" } });

  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@cec-connect.com",
      passwordHash: adminPassword,
      userRoles: { create: { roleId: adminRole.id } },
    },
  });
  console.log("Admin user and roles created.");

  // 3. Read all data from CSV into memory first
  const studentsFromCsv = [];
  const filePath = path.join(__dirname, "..", "btech-students.csv");

  console.log("🎓 Reading students from CSV file...");
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      studentsFromCsv.push(row);
    })
    .on("end", async () => {
      console.log(
        `✅ CSV file processed. Found ${studentsFromCsv.length} students.`
      );
      let successCount = 0;
      let errorCount = 0;

      // 4. Process and insert each student record one by one
      for (const row of studentsFromCsv) {
        try {
          const departmentName = row.allottedBranch?.toLowerCase();
          if (!departmentName) {
            console.warn(
              `Skipping student "${row.name}" due to missing 'allottedBranch'.`
            );
            continue;
          }
          let departmentCode;
          console.log(row.allottedBranch);
          if (row.allottedBranch.toString().toLowerCase().includes(`ai`)) {
            departmentCode = `AD`;
          } else if (
            row.allottedBranch.toString().toLowerCase().includes(`computer`) ||
            row.allottedBranch.toString().toLowerCase().includes(`cse`)
          ) {
            departmentCode = `CSE`;
          } else if (
            row.allottedBranch.toString().toLowerCase().includes(`electrical`)
          ) {
            departmentCode = `EEE`;
          } else {
            departmentCode = `ECE`;
          }
          const department = await prisma.department.upsert({
            where: { name: departmentName },
            update: {},
            create: { name: departmentName, departmentCode },
          });
          const salt = await bcrypt.genSalt(10);
          const adminPassword = await bcrypt.hash("admin123", salt);
          // Prepare the complete student data object
          const studentData = {
            // CHANGED: Use a nested 'connect' query for the department relationship
            department: {
              connect: { id: department.id },
            },
            password: "", // Default value as requested
            program: "btech", // Default value
            status: "approved", // Default value
            email: row.studentEmail,
            createdAt: parseCustomDate(row.createdAt),
            updatedAt: parseCustomDate(row.createdAt), // Set to same as createdAt
            name: row.name,
            dateOfBirth: parseCustomDate(row.dateOfBirth),
            gender: row.gender?.toLowerCase() || null,
            religion: row.religion || null,
            category: row.category?.toLowerCase() || null,
            stateOfResidence: row.stateOfResidence || null,
            nationality: row.nationality || null,
            aadhaarNumber: row.aadhaarNumber,
            fatherName: row.fatherName || null,
            motherName: row.motherName || null,
            guardianName: row.guardianName || null,
            guardianRelationship: row.guardianRelationship || null,
            parentEmail: row.parentEmail || null,
            guardianEmail: row.guardianEmail || null,
            permanentAddress: row.permanentAddress || null,
            contactAddress: row.contactAddress || null,
            localGuardianAddress: row.localGuardianAddress || null,
            studentPhoneNumber: row.studentPhoneNumber,
            fatherPhoneNumber: row.fatherPhoneNumber || null,
            motherPhoneNumber: row.motherPhoneNumber || null,
            localGuardianPhoneNumber: row.localGuardianPhoneNumber || null,
            annualFamilyIncome: row.annualFamilyIncome,
            motherTongue: row.motherTongue || null,
            bloodGroup: row.bloodGroup || null,
            lastInstitution: row.lastInstitution || null,
            tcNumber: row.tcNumber || null,
            tcDate: parseCustomDate(row.tcDate),
            entranceRollNo: row.entranceRollNo || null,
            entranceRank: row.entranceRank
              ? parseInt(row.entranceRank, 10)
              : null,
            qualifyingExamName: row.qualifyingExamName || null,
            qualifyingExamRegisterNo: row.qualifyingExamRegisterNo || null,
            physicsScore: row.physicsScore
              ? parseFloat(row.physicsScore)
              : null,
            chemistryScore: row.chemistryScore
              ? parseFloat(row.chemistryScore)
              : null,
            mathsScore: row.mathsScore ? parseFloat(row.mathsScore) : null,
            keamSubjectTotal: row.keamSubjectTotal
              ? parseFloat(row.keamSubjectTotal)
              : null,
            percentage: row.percentage ? parseFloat(row.percentage) : null,
            accountNumber: row.accountNumber || null,
            bankName: row.bankName || null,
            ifscCode: row.ifscCode || null,
            bankBranch: row.bankBranch || null,
            allottedBranch: row.allottedBranch,
            admissionDate: parseCustomDate(row.admissionDate),
            admissionType: row.admissionType?.toLowerCase(),
            admissionQuota: row.admissionQuota?.toLowerCase() || null,
            admittedCategory: row.admittedCategory || null,
            entranceType: row.entranceType || null,
            isFeeConcessionEligible:
              row.isFeeConcessionEligible?.toLowerCase() === "true",
            entranceTotalScore: row.entranceTotalScore
              ? parseFloat(row.entranceTotalScore)
              : null,
          };

          await prisma.student.create({
            data: studentData,
          });

          successCount++;
          console.log(
            `--> Successfully inserted student record for ${row.name}`
          );
        } catch (e) {
          errorCount++;
          console.error(`Error processing student "${row.name}":`, e.message);
        }
      }

      console.log(
        `\n✨ Import complete. Success: ${successCount}, Failures: ${errorCount}`
      );
      await prisma.$disconnect();
    });
}

main().catch((e) => {
  console.error("An error occurred during the seeding process:", e);
  process.exit(1);
});
