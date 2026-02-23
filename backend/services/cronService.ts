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

      console.log(
        `Deleted ${result.count} stale student applications successfully.`,
      );
    } catch (error) {
      console.error("Error during yearly stale admissions cleanup:", error);
    }
  });

  console.log(
    "Cron scheduling initialized. Stale admissions cleanup job scheduled for Jan 1st.",
  );

  // Run every day at 12:00 AM (midnight)
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily email queue processor...");
    try {
      const pendingEmails = await prisma.emailQueue.findMany({
        where: { status: "PENDING" },
        take: 100, // Process in batches to avoid memory issues
      });

      if (pendingEmails.length === 0) {
        console.log("No pending emails to send.");
        return;
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const email of pendingEmails) {
        try {
          // Simulate async email sending
          // In a real app, you would use Nodemailer, SendGrid, etc.
          console.log(`[CRON] Sending email to ${email.to}: ${email.subject}`);
          await new Promise((resolve) => setTimeout(resolve, 100));

          await prisma.emailQueue.update({
            where: { id: email.id },
            data: { status: "SENT" },
          });
          sentCount++;
        } catch (err) {
          console.error(`[CRON] Failed to send email to ${email.to}:`, err);
          await prisma.emailQueue.update({
            where: { id: email.id },
            data: { status: "FAILED" },
          });
          failedCount++;
        }
      }

      console.log(
        `Daily email queue processed. Sent: ${sentCount}, Failed: ${failedCount}`,
      );
    } catch (error) {
      console.error("Error during daily email queue processing:", error);
    }
  });
  console.log(
    "Cron scheduling initialized. Daily email queue processor scheduled for midnight.",
  );
};
