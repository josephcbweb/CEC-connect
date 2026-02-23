"use strict";
// import { prisma } from "../lib/prisma";
// async function main() {
//     const email = "test_tc_issued_by@example.com";
//     const aadhaar = "999988887777";
//     // Cleanup past
//     await prisma.student.deleteMany({
//         where: { email }
//     });
//     console.log("Creating test student...");
//     const student = await prisma.student.create({
//         data: {
//             password: "password123", // Added missing required field
//             religion: "Test Religion", // Added missing required field
//             mother_tongue: "Test Language", // Added missing required field
//             name: "TC Issued By Test",
//             dateOfBirth: new Date("2000-01-01"),
//             gender: "male",
//             email,
//             student_phone_number: "9988776655",
//             aadhaar_number: aadhaar,
//             program: "btech",
//             allotted_branch: "CS",
//             last_institution: "Test School Name",
//             qualifying_exam_name: "Test Exam",
//             qualifying_exam_register_no: "REG123",
//             tc_issued_by: "Test TC Issuer",
//             tc_number: "TC123",
//             contact_address: "Fake Contact",
//             permanent_address: "Fake Permanent",
//             state_of_residence: "Kerala",
//             is_fee_concession_eligible: false,
//             admission_type: "regular",
//             status: "pending",
//             fatherName: "Test Father",
//             motherName: "Test Mother"
//         }
//     });
//     console.log("Created student:", student.admission_number, student.name);
//     console.log("Last Institution:", student.last_institution);
//     console.log("TC Issued By:", student.tc_issued_by);
//     if (student.last_institution === "Test School Name" && student.tc_issued_by === "Test TC Issuer") {
//         console.log("SUCCESS: Backend correctly handles, saves, and returns the new institution fields!");
//     } else {
//         console.error("ERROR: Fields were not saved correctly.");
//     }
// }
// import * as fs from 'fs';
// main()
//     .catch((e) => {
//         fs.writeFileSync('prisma_error.txt', e.message);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });
