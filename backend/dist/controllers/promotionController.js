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
Object.defineProperty(exports, "__esModule", { value: true });
exports.undoLastPromotion = exports.promoteStudents = exports.getPromotionStats = void 0;
const prisma_1 = require("../lib/prisma");
const getPromotionStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get counts for all semesters
        const semesterCounts = yield prisma_1.prisma.student.groupBy({
            by: ["currentSemester"],
            where: {
                status: "approved", // Only promote approved/active students
            },
            _count: {
                id: true,
            },
        });
        const counts = {};
        semesterCounts.forEach((item) => {
            counts[item.currentSemester] = item._count.id;
        });
        // Detect Current State
        const oddCount = (counts[1] || 0) + (counts[3] || 0) + (counts[5] || 0) + (counts[7] || 0);
        const evenCount = (counts[2] || 0) + (counts[4] || 0) + (counts[6] || 0) + (counts[8] || 0);
        const currentType = oddCount >= evenCount ? "ODD" : "EVEN";
        res.json({
            counts,
            currentType,
            recommendedTransitions: currentType === "ODD"
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
    }
    catch (error) {
        console.error("Error fetching promotion stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});
exports.getPromotionStats = getPromotionStats;
const promoteStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { transitions, semesterType, yearBackIds = [] } = req.body;
    if (!transitions || !Array.isArray(transitions) || transitions.length === 0) {
        return res.status(400).json({ error: "No transitions provided." });
    }
    try {
        // 1. Identification Phase
        const allAffectedIds = [];
        const historyDetails = [];
        let totalPromoted = 0;
        let totalArchived = 0;
        let totalYearBack = 0;
        const transitionGroups = [];
        for (const t of transitions) {
            const eligibleStudents = yield prisma_1.prisma.student.findMany({
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
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            for (const group of transitionGroups) {
                const { transition, ids, ybIds } = group;
                // A. Regular Promotions
                if (ids.length > 0) {
                    if (transition.to === "GRADUATED") {
                        yield tx.student.updateMany({
                            where: { id: { in: ids } },
                            data: { status: "graduated" },
                        });
                        totalArchived += ids.length;
                    }
                    else {
                        yield tx.student.updateMany({
                            where: { id: { in: ids } },
                            data: { currentSemester: transition.to },
                        });
                        totalPromoted += ids.length;
                    }
                }
                // B. Year Back Logic
                if (ybIds.length > 0) {
                    const yearBackTarget = transition.from - 1;
                    if (yearBackTarget > 0) {
                        yield tx.student.updateMany({
                            where: { id: { in: ybIds } },
                            data: { currentSemester: yearBackTarget },
                        });
                        totalYearBack += ybIds.length;
                    }
                }
                historyDetails.push({
                    from: transition.from,
                    to: transition.to,
                    promotedIds: ids,
                    yearBackIds: ybIds
                });
            }
            yield tx.promotionHistory.create({
                data: {
                    semesterType,
                    promotedAt: new Date(),
                    affectedStudentIds: allAffectedIds,
                    details: JSON.stringify(historyDetails),
                    adminId: 1,
                },
            });
        }));
        res.json({
            success: true,
            message: `Successfully promoted ${totalPromoted} students, archived ${totalArchived}, and year-backed ${totalYearBack}.`,
            promoted: totalPromoted,
            archived: totalArchived,
            yearBack: totalYearBack
        });
    }
    catch (error) {
        console.error("Promotion failed:", error);
        res.status(500).json({ error: "Promotion failed due to an internal error." });
    }
});
exports.promoteStudents = promoteStudents;
const undoLastPromotion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lastPromotion = yield prisma_1.prisma.promotionHistory.findFirst({
            orderBy: { promotedAt: "desc" },
        });
        if (!lastPromotion) {
            return res.status(404).json({ error: "No promotion history found to undo." });
        }
        const details = JSON.parse(lastPromotion.details);
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            for (const op of details) {
                // Revert promoted students
                // Legacy 'ids' supported for older history
                const promotedIds = op.promotedIds || op.ids || [];
                const yearBackIds = op.yearBackIds || [];
                const { from, to } = op;
                if (promotedIds.length > 0) {
                    if (to === "GRADUATED") {
                        yield tx.student.updateMany({
                            where: { id: { in: promotedIds } },
                            data: { status: "approved" }
                        });
                    }
                    else {
                        yield tx.student.updateMany({
                            where: { id: { in: promotedIds } },
                            data: { currentSemester: from }
                        });
                    }
                }
                // Revert Year Backs (they went from -> from-1, so set back to from)
                if (yearBackIds.length > 0) {
                    yield tx.student.updateMany({
                        where: { id: { in: yearBackIds } },
                        data: { currentSemester: from }
                    });
                }
            }
            yield tx.promotionHistory.delete({
                where: { id: lastPromotion.id },
            });
        }));
        res.json({ success: true, message: "Last promotion undone successfully." });
    }
    catch (error) {
        console.error("Undo failed:", error);
        res.status(500).json({ error: "Failed to undo promotion." });
    }
});
exports.undoLastPromotion = undoLastPromotion;
