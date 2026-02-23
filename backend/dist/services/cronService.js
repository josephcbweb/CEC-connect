"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../lib/prisma");
const enums_1 = require("../generated/prisma/enums");
// This cron job is scheduled to run at 00:00 on January 1st every year
const initCronJobs = () => {
    node_cron_1.default.schedule("0 0 1 1 *", () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("Running yearly cleanup of stale admission applications...");
        try {
            // Find students who are not approved and have not been assigned to a class
            const result = yield prisma_1.prisma.student.deleteMany({
                where: {
                    status: {
                        in: [
                            enums_1.StudentStatus.rejected,
                            enums_1.StudentStatus.pending,
                            enums_1.StudentStatus.waitlisted,
                        ],
                    },
                },
            });
            console.log(`Deleted ${result.count} stale student applications successfully.`);
        }
        catch (error) {
            console.error("Error during yearly stale admissions cleanup:", error);
        }
    }));
    console.log("Cron scheduling initialized. Stale admissions cleanup job scheduled for Jan 1st.");
    // Run every day at 12:00 AM (midnight)
    node_cron_1.default.schedule("0 0 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("Running daily email queue processor...");
        try {
            const pendingEmails = yield prisma_1.prisma.emailQueue.findMany({
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
                    yield new Promise((resolve) => setTimeout(resolve, 100));
                    yield prisma_1.prisma.emailQueue.update({
                        where: { id: email.id },
                        data: { status: "SENT" },
                    });
                    sentCount++;
                }
                catch (err) {
                    console.error(`[CRON] Failed to send email to ${email.to}:`, err);
                    yield prisma_1.prisma.emailQueue.update({
                        where: { id: email.id },
                        data: { status: "FAILED" },
                    });
                    failedCount++;
                }
            }
            console.log(`Daily email queue processed. Sent: ${sentCount}, Failed: ${failedCount}`);
        }
        catch (error) {
            console.error("Error during daily email queue processing:", error);
        }
    }));
    console.log("Cron scheduling initialized. Daily email queue processor scheduled for midnight.");
};
exports.initCronJobs = initCronJobs;
