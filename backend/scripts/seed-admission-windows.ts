// import { Program } from "../generated/prisma/enums";
// import { prisma } from "../lib/prisma";

// async function seedAdmissionWindows() {
//   console.log("🌱 Seeding admission windows...");

//   try {
//     // Check if admission windows already exist
//     const existingWindows = await prisma.admissionWindow.findMany();

//     if (existingWindows.length > 0) {
//       console.log("✅ Admission windows already exist. Skipping seed.");
//       return;
//     }

//     // Create admission windows for B.Tech and MCA
//     const currentYear = new Date().getFullYear();

//     const btechBatch = await prisma.batch.create({
//       data: {
//         name: `B.Tech ${currentYear}-${currentYear + 4}`,
//         startYear: currentYear,
//         endYear: currentYear + 4,
//         status: "UPCOMING",
//       },
//     });

//     const btechWindow = await prisma.admissionWindow.create({
//       data: {
//         program: Program.BTECH,
//         startDate: new Date(`${currentYear}-01-01`),
//         endDate: new Date(`${currentYear}-05-31`),
//         isOpen: true,
//         description: `B.Tech admissions for ${currentYear}-${
//           currentYear + 1
//         } academic year. Applications are now open for various specializations.`,
//         batchId: btechBatch.id,
//       },
//     });

//     const mcaBatch = await prisma.batch.create({
//       data: {
//         name: `MCA ${currentYear}-${currentYear + 2}`,
//         startYear: currentYear,
//         endYear: currentYear + 2,
//         status: "UPCOMING",
//       },
//     });

//     const mcaWindow = await prisma.admissionWindow.create({
//       data: {
//         program: Program.MCA,
//         startDate: new Date(`${currentYear}-06-01`),
//         endDate: new Date(`${currentYear}-07-15`),
//         isOpen: true,
//         description: `MCA admissions for ${currentYear}-${
//           currentYear + 1
//         } academic year. Apply now for Master of Computer Applications program.`,
//         batchId: mcaBatch.id,
//       },
//     });

//     console.log("✅ Created B.Tech admission window:", btechWindow);
//     console.log("✅ Created MCA admission window:", mcaWindow);
//     console.log("🎉 Admission windows seeded successfully!");
//   } catch (error) {
//     console.error("❌ Error seeding admission windows:", error);
//     throw error;
//   }
// }

// seedAdmissionWindows()
//   .catch((e) => {
//     console.error("An error occurred during seeding:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
