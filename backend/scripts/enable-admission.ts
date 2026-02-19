
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Setting up admission window for testing...");

    try {
        // 1. Ensure Departments exist
        console.log("Upserting CSE department...");
        const cse = await prisma.department.upsert({
            where: { department_code: "CSE" },
            update: {},
            create: {
                name: "Computer Science and Engineering",
                department_code: "CSE",
            },
        });
        console.log("Department ensured:", cse.name);

        // 2. Ensure Batch exists
        const batchName = "2025-2029";
        console.log(`Upserting Batch ${batchName}...`);
        const batch = await prisma.batch.upsert({
            where: { name: batchName },
            update: { status: "UPCOMING" },
            create: {
                name: batchName,
                startYear: 2025,
                endYear: 2029,
                status: "UPCOMING",
            },
        });
        console.log("Batch ensured:", batch.name);

        // Link Dept to Batch if not exists
        console.log("Linking Batch to Department...");
        const batchDept = await prisma.batchDepartment.findUnique({
            where: {
                batchId_departmentId: {
                    batchId: batch.id,
                    departmentId: cse.id
                }
            }
        });

        if (!batchDept) {
            await prisma.batchDepartment.create({
                data: {
                    batchId: batch.id,
                    departmentId: cse.id
                }
            });
            console.log("Linked CSE to Batch");
        } else {
            console.log("Batch already linked to CSE");
        }

        // 3. Ensure Admission Window is OPEN
        // Program enum: btech, mca
        const program = "btech"; // Using string literal, hopefully matches enum

        console.log("Upserting Admission Window...");
        // Need to cast program to Program enum if using strict TS, but runtime it's string.
        // However, Prisma client exports enums.

        const window = await prisma.admissionWindow.upsert({
            where: { batchId: batch.id },
            update: {
                isOpen: true,
                startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
                program: "btech" as any,
            },
            create: {
                program: "btech" as any,
                startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                isOpen: true,
                batchId: batch.id,
                description: "Test Admission Window"
            },
        });

        console.log("Admission Window Open:", window.isOpen);

    } catch (error) {
        console.error("Error in setup script:", error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
