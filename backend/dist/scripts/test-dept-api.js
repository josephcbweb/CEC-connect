"use strict";
// import { PrismaClient } from "@prisma/client";
// // Mocking the API call logic by running the query directly to verify the data path
// const prisma = new PrismaClient();
// async function main() {
//     console.log("Testing Department Fetch Logic...");
//     const program = "btech";
//     const now = new Date();
//     console.log(`Current Time: ${now.toISOString()}`);
//     const activeWindow = await prisma.admissionWindow.findFirst({
//         where: {
//             program: program as any,
//             isOpen: true,
//             // startDate: { lte: now }, // Commenting out date check to debug strictness if needed, but in code we use it.
//             // Let's use exactly what we wrote in controller to be sure.
//             startDate: { lte: now },
//             endDate: { gte: now },
//         },
//         include: {
//             batch: {
//                 include: {
//                     batchDepartments: {
//                         include: {
//                             department: true,
//                         },
//                     },
//                 },
//             },
//         },
//     });
//     if (!activeWindow) {
//         console.log("No active window found!");
//         // Debug: Find ANY window
//         const anyWindow = await prisma.admissionWindow.findFirst({});
//         console.log("Any window:", anyWindow);
//         return;
//     }
//     console.log("Found Active Window:", activeWindow.id);
//     console.log("Batch:", activeWindow.batch?.name);
//     const depts = activeWindow.batch?.batchDepartments.map(bd => bd.department.name);
//     console.log("Departments linked:", depts);
// }
// main()
//     .catch(console.error)
//     .finally(() => prisma.$disconnect());
