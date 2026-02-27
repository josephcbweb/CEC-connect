import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { StudentStatus } from "../generated/prisma/enums";

// Define the shape of a transition request
interface Transition {
  from: number;
  to: number | "GRADUATED";
}

interface PromotionRequest {
  transitions: Transition[];
  semesterType: "ODD" | "EVEN";
  yearBackIds?: number[]; // IDs of students who are detained/year back
  dueAction?: "CLEAR" | "KEEP" | "NONE";
  feeAction?: "CLEAR" | "ARCHIVE" | "KEEP" | "NONE";
}

export const getPromotionStats = async (req: Request, res: Response) => {
  try {
    // Get counts for all semesters
    const semesterCounts = await prisma.student.groupBy({
      by: ["currentSemester"],
      where: {
        status: "approved", // Only promote approved/active students
      },
      _count: {
        id: true,
      },
    });

    const counts: Record<number, number> = {};
    semesterCounts.forEach((item) => {
      counts[item.currentSemester] = item._count.id;
    });

    // Detect Current State
    const oddCount = (counts[1] || 0) + (counts[3] || 0) + (counts[5] || 0) + (counts[7] || 0);
    const evenCount = (counts[2] || 0) + (counts[4] || 0) + (counts[6] || 0) + (counts[8] || 0);

    const currentType = oddCount >= evenCount ? "ODD" : "EVEN";

    // Calculate pending dues counts per semester
    const pendingDuesQuery = await prisma.noDueRequest.groupBy({
      by: ["targetSemester"],
      where: {
        status: "pending",
        isArchived: false,
      },
      _count: {
        id: true,
      },
    });

    const pendingDues: Record<number, number> = {};
    pendingDuesQuery.forEach((item) => {
      pendingDues[item.targetSemester] = item._count.id;
    });

    // Calculate pending fees counts per semester
    const pendingFeesQuery = await prisma.invoice.groupBy({
      by: ["semester"],
      where: {
        status: "unpaid",
        fee: { archived: false },
      },
      _count: {
        id: true,
      },
    });

    const pendingFees: Record<number, number> = {};
    pendingFeesQuery.forEach((item) => {
      if (item.semester) {
        pendingFees[item.semester] = item._count.id;
      }
    });

    res.json({
      counts,
      pendingDues,
      pendingFees,
      currentType,
      recommendedTransitions:
        currentType === "ODD"
          ? [
            { from: 1, to: 2, label: "S1 → S2" },
            { from: 3, to: 4, label: "S3 → S4" },
            { from: 5, to: 6, label: "S5 → S6" },
            { from: 7, to: 8, label: "S7 → S8" },
          ]
          : [
            { from: 1, to: 2, label: "S1 → S2" }, // Added as per request
            { from: 2, to: 3, label: "S2 → S3" },
            { from: 4, to: 5, label: "S4 → S5" },
            { from: 6, to: 7, label: "S6 → S7" },
            { from: 8, to: "GRADUATED", label: "S8 → Graduated" },
          ],
    });
  } catch (error) {
    console.error("Error fetching promotion stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export const promoteStudents = async (req: Request, res: Response) => {
  const { transitions, semesterType, yearBackIds = [], dueAction = "NONE", feeAction = "NONE" } = req.body as PromotionRequest;

  if (!transitions || !Array.isArray(transitions) || transitions.length === 0) {
    return res.status(400).json({ error: "No transitions provided." });
  }

  try {
    // 1. Identification Phase
    const allAffectedIds: number[] = [];
    const historyDetails: any[] = [];
    let totalPromoted = 0;
    let totalArchived = 0;
    let totalYearBack = 0;

    const transitionGroups: { transition: Transition; ids: number[]; ybIds: number[] }[] = [];

    for (const t of transitions) {
      const eligibleStudents = await prisma.student.findMany({
        where: {
          currentSemester: t.from,
          status: "approved",
        },
        select: { id: true },
      });

      const allIds = eligibleStudents.map((s) => s.id);

      if (allIds.length > 0) {
        const ybIds = allIds.filter(id => yearBackIds.includes(id));
        const promoteIds = allIds.filter(id => !yearBackIds.includes(id));

        transitionGroups.push({ transition: t, ids: promoteIds, ybIds });
        allAffectedIds.push(...allIds);
      }
    }

    if (allAffectedIds.length === 0) {
      return res.status(200).json({ message: "No eligible students found for promotion." });
    }

    // 2. Execution Phase
    await prisma.$transaction(async (tx) => {
      for (const group of transitionGroups) {
        const { transition, ids, ybIds } = group;

        // A. Regular Promotions
        if (ids.length > 0) {
          if (transition.to === "GRADUATED") {
            await tx.student.updateMany({
              where: { id: { in: ids } },
              data: { status: "graduated" as any },
            });
            totalArchived += ids.length;
          } else {
            await tx.student.updateMany({
              where: { id: { in: ids } },
              data: { currentSemester: transition.to as number },
            });
            totalPromoted += ids.length;
          }
        }

        // B. Year Back Logic
        if (ybIds.length > 0) {
          const yearBackTarget = transition.from - 1;
          if (yearBackTarget > 0) {
            await tx.student.updateMany({
              where: { id: { in: ybIds } },
              data: { currentSemester: yearBackTarget },
            });
            totalYearBack += ybIds.length;
          }
        }

        // C. Due Action Handling
        if (dueAction !== "NONE" && ids.length > 0) {
          const activeRequests = await tx.noDueRequest.findMany({
            where: {
              studentId: { in: ids },
              status: "pending",
              isArchived: false,
            },
            select: { id: true },
          });

          const requestIds = activeRequests.map((r) => r.id);

          if (requestIds.length > 0) {
            if (dueAction === "CLEAR") {
              await tx.noDueRequest.updateMany({
                where: { id: { in: requestIds } },
                data: { status: "approved" },
              });
              await tx.noDue.updateMany({
                where: { requestId: { in: requestIds } },
                data: { status: "cleared" },
              });
            } else if (dueAction === "KEEP") {
              await tx.noDueRequest.updateMany({
                where: { id: { in: requestIds } },
                data: { isArchived: true },
              });
            }
          }
        }

        // D. Fee Action Handling
        if (feeAction !== "NONE" && feeAction !== "KEEP" && ids.length > 0) {
          if (feeAction === "CLEAR") {
            // Mark all unpaid invoices for these students as paid
            await tx.invoice.updateMany({
              where: {
                studentId: { in: ids },
                status: "unpaid",
                semester: transition.from
              },
              data: { status: "paid" },
            });
          } else if (feeAction === "ARCHIVE") {
            // Archive the underlying FeeDetails for unpaid invoices in this semester
            const unpaidInvoices = await tx.invoice.findMany({
              where: {
                studentId: { in: ids },
                status: "unpaid",
                semester: transition.from
              },
              select: { feeId: true },
            });
            const feeIds = unpaidInvoices.map((inv) => inv.feeId);
            if (feeIds.length > 0) {
              await tx.feeDetails.updateMany({
                where: { id: { in: feeIds } },
                data: { archived: true },
              });
            }
          }
        }

        historyDetails.push({
          from: transition.from,
          to: transition.to,
          promotedIds: ids,
          yearBackIds: ybIds
        });
      }

      await tx.promotionHistory.create({
        data: {
          semesterType,
          promotedAt: new Date(),
          affectedStudentIds: allAffectedIds,
          details: JSON.stringify(historyDetails),
          adminId: 1,
        },
      });
    });

    res.json({
      success: true,
      message: `Successfully promoted ${totalPromoted} students, archived ${totalArchived}, and year-backed ${totalYearBack}.`,
      promoted: totalPromoted,
      archived: totalArchived,
      yearBack: totalYearBack
    });
  } catch (error) {
    console.error("Promotion failed:", error);
    res.status(500).json({ error: "Promotion failed due to an internal error." });
  }

};

export const undoLastPromotion = async (req: Request, res: Response) => {
  try {
    const lastPromotion = await prisma.promotionHistory.findFirst({
      orderBy: { promotedAt: "desc" },
    });

    if (!lastPromotion) {
      return res.status(404).json({ error: "No promotion history found to undo." });
    }

    const details = JSON.parse(lastPromotion.details as string);

    await prisma.$transaction(async (tx) => {
      for (const op of details) {
        // Revert promoted students
        // Legacy 'ids' supported for older history
        const promotedIds = op.promotedIds || op.ids || [];
        const yearBackIds = op.yearBackIds || [];
        const { from, to } = op;

        if (promotedIds.length > 0) {
          if (to === "GRADUATED") {
            await tx.student.updateMany({
              where: { id: { in: promotedIds } },
              data: { status: "approved" as any }
            });
          } else {
            await tx.student.updateMany({
              where: { id: { in: promotedIds } },
              data: { currentSemester: from }
            });
          }
        }

        // Revert Year Backs (they went from -> from-1, so set back to from)
        if (yearBackIds.length > 0) {
          await tx.student.updateMany({
            where: { id: { in: yearBackIds } },
            data: { currentSemester: from }
          });
        }
      }

      await tx.promotionHistory.delete({
        where: { id: lastPromotion.id },
      });
    });

    res.json({ success: true, message: "Last promotion undone successfully." });

  } catch (error) {
    console.error("Undo failed:", error);
    res.status(500).json({ error: "Failed to undo promotion." });
  }
};
