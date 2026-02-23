"use strict";
// import { prisma } from "../lib/prisma";
// // Mock Express-like environment not needed if we import the helper logic directly,
// // but the helper is inside the controller and not exported.
// // So I will basically replicate the helper logic here to test it against the DB behavior
// // OR I can use the controller function if I mock req/res.
// // Let's rely on testing the logic by creating a dummy student and trying to update them via the controller.
// // But calling controller requires Express objects.
// // I will just test the logic sequence directly in this script.
// async function testAdmissionLogic() {
//     console.log("🧪 Starting Admission Number Verification...");
//     try {
//         // 1. Find or Create a dummy 'Computer Science' department
//         const csDept = await prisma.department.findUnique({
//             where: { name: "Computer Science" }
//         });
//         if (!csDept) {
//             console.error("❌ Computer Science department not found!");
//             return;
//         }
//         console.log("✅ Found CS Dept:", csDept.department_code); // Should be CSE
//         // 2. Create a dummy student with status 'pending'
//         const student = await prisma.student.create({
//             data: {
//                 name: "Test Student ADM",
//                 password: "test",
//                 email: `testadm${Date.now()}@example.com`,
//                 gender: "male",
//                 religion: "test",
//                 nationality: "test",
//                 mother_tongue: "test",
//                 student_phone_number: `111${Date.now()}`,
//                 permanent_address: "test",
//                 contact_address: "test",
//                 state_of_residence: "test",
//                 aadhaar_number: `AAD${Date.now()}`,
//                 program: "btech",
//                 preferredDepartmentId: csDept.id,
//                 status: "pending",
//                 admission_type: "regular",
//                 allotted_branch: "CSE",
//                 last_institution: "test",
//                 qualifying_exam_name: "test",
//                 qualifying_exam_register_no: "test",
//                 // Required placeholders
//                 is_fee_concession_eligible: false,
//                 currentSemester: 1,
//                 bus_service: false,
//                 hostel_service: false,
//             }
//         });
//         console.log("✅ Created Pending Student:", student.id);
//         // 3. Simulate Logic
//         // Copy-pasting the exact logic I wrote in the controller to verify it runs in this environment
//         // (Simulating the controller logic)
//         const year = new Date().getFullYear(); // 2026? User said 22 is current year, but logic uses real date.
//         // If year 2026, prefix will be cec26cs...
//         // User example: cec22cs073. 22 came from their example, likely they meant admission year.
//         // "22 is the current year" -> maybe they are stuck in 2022? Or they want academic year?
//         // Usually it implies 'YY' format of current year.
//         let deptCode = csDept.department_code.toLowerCase();
//         if (deptCode === "cse") deptCode = "cs";
//         const prefix = `cec${String(year).slice(-2)}${deptCode}`; // cec26cs
//         console.log("ℹ️ Generated Prefix:", prefix);
//         const count = await prisma.student.count({
//             where: { admission_number: { startsWith: prefix } }
//         });
//         const nextNum = `${prefix}${String(count + 1).padStart(3, "0")}`;
//         console.log("ℹ️ Proposed Admission Number:", nextNum);
//         // 4. Update the student
//         const updated = await prisma.student.update({
//             where: { id: student.id },
//             data: {
//                 admission_number: nextNum,
//                 status: "approved",
//                 departmentId: csDept.id
//             }
//         });
//         console.log("✅ Validated Update. New Admission Number:", updated.admission_number);
//         if (!updated.admission_number?.startsWith(prefix)) {
//             console.error("❌ Admission number format mismatch!");
//         } else {
//             console.log("✅ Format Verified.");
//         }
//         // McLeanup
//         await prisma.student.delete({ where: { id: student.id } });
//         console.log("🧹 Cleanup done.");
//     } catch (error) {
//         console.error("❌ Test Failed:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }
// testAdmissionLogic();
