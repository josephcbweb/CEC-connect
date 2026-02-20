import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { StudentStatus } from "../generated/prisma/enums";

// This cron job is scheduled to run at 00:00 on January 1st every year
export const initCronJobs = () => {
    cron.schedule("0 0 1 1 *", async () => {
        console.log("Running yearly cleanup of stale admission applications...");
        try {
            // Find students who are not approved and have not been assigned to a class
            const result = await prisma.student.deleteMany({
                where: {
                    status: {
                        in: [
                            StudentStatus.rejected,
                            StudentStatus.pending,
                            StudentStatus.waitlisted,
                        ],
                    },
                },
            });

            console.log(`Deleted ${result.count} stale student applications successfully.`);
        } catch (error) {
            console.error("Error during yearly stale admissions cleanup:", error);
        }
    });

    console.log("Cron scheduling initialized. Stale admissions cleanup job scheduled for Jan 1st.");
};
