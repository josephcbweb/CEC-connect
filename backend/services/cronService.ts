import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { StudentStatus, InvoiceStatus } from "../generated/prisma/enums";
import { Decimal } from "@prisma/client/runtime/client";

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

  // --- Daily Fine Calculation Cron Job ---
  // Runs every day at 12:05 AM (after email queue)
  cron.schedule("5 0 * * *", async () => {
    console.log("[CRON] Running daily fine calculation...");
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all unpaid invoices that are past due and have a linked fee structure with fines enabled
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.unpaid,
          dueDate: { lt: today },
          feeStructureId: { not: null },
          FeeStructure: {
            fineEnabled: true,
            fineSlabs: { some: {} }, // Has at least one slab
          },
        },
        include: {
          FeeStructure: {
            include: {
              fineSlabs: { orderBy: { startDay: "asc" } },
            },
          },
        },
      });

      if (overdueInvoices.length === 0) {
        console.log("[CRON] No overdue invoices with fines to process.");
        return;
      }

      let updatedCount = 0;

      for (const invoice of overdueInvoices) {
        const slabs = invoice.FeeStructure?.fineSlabs;
        if (!slabs || slabs.length === 0) continue;

        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        // Calculate days overdue (from due date to today)
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysOverdue <= 0) continue;

        // Calculate total fine based on slabs
        let totalFine = new Decimal(0);

        for (const slab of slabs) {
          // Determine how many days fall into this slab
          const slabStart = slab.startDay; // e.g., 1 (1st day after due)
          const slabEnd = slab.endDay; // e.g., 15, or null for unlimited

          if (daysOverdue < slabStart) break; // Haven't reached this slab yet

          const effectiveEnd =
            slabEnd !== null ? Math.min(daysOverdue, slabEnd) : daysOverdue;
          const daysInSlab = effectiveEnd - slabStart + 1;

          if (daysInSlab > 0) {
            totalFine = totalFine.add(
              new Decimal(slab.amountPerDay).times(daysInSlab),
            );
          }
        }

        const baseAmount = invoice.baseAmount ?? invoice.amount;
        const newAmount = new Decimal(baseAmount).add(totalFine);

        // Only update if the fine has changed
        if (!totalFine.equals(invoice.fineAmount)) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              fineAmount: totalFine,
              baseAmount: baseAmount,
              amount: newAmount,
            },
          });
          updatedCount++;
        }
      }

      console.log(
        `[CRON] Fine calculation complete. Updated ${updatedCount} of ${overdueInvoices.length} overdue invoices.`,
      );
    } catch (error) {
      console.error("[CRON] Error during daily fine calculation:", error);
    }
  });

  console.log(
    "Cron scheduling initialized. Daily fine calculation scheduled for 12:05 AM.",
  );
};
