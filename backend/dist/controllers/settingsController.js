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
exports.getActiveRequestCount = exports.getSettings = exports.toggleSettings = void 0;
exports.getSemesterStats = getSemesterStats;
exports.promoteStudents = promoteStudents;
const prisma_1 = require("../lib/prisma");
const toggleSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, value, action } = req.body;
        const setting = yield prisma_1.prisma.setting.upsert({
            where: { key: name },
            update: { enabled: value },
            create: { key: name, enabled: value },
        });
        // If activating noDueRequest, send notification to all students
        if (name === "noDueRequestEnabled" && value === true) {
            const adminUser = yield prisma_1.prisma.user.findFirst();
            yield prisma_1.prisma.notification.create({
                data: {
                    title: "Semester Registration Open",
                    description: "No Due requests for the upcoming semester registration are now being accepted. Please visit the Semester Registration page to view your status.",
                    targetType: "ALL",
                    status: "published",
                    priority: "NORMAL",
                    senderId: (adminUser === null || adminUser === void 0 ? void 0 : adminUser.id) || 1
                }
            });
        }
        // If disabling noDueRequest, handle pending requests based on `action`
        if (name === "noDueRequestEnabled" && value === false) {
            if (action === "CLEAR") {
                const pendingReqs = yield prisma_1.prisma.noDueRequest.findMany({
                    where: { status: "pending", isArchived: false },
                    select: { id: true },
                });
                const reqIds = pendingReqs.map((r) => r.id);
                if (reqIds.length > 0) {
                    yield prisma_1.prisma.noDueRequest.updateMany({
                        where: { id: { in: reqIds } },
                        data: { status: "approved" },
                    });
                    yield prisma_1.prisma.noDue.updateMany({
                        where: { requestId: { in: reqIds }, status: "pending" },
                        data: { status: "cleared" },
                    });
                }
            }
            else {
                // Default KEEP behavior
                yield prisma_1.prisma.noDueRequest.updateMany({
                    where: { status: "pending", isArchived: false },
                    data: { isArchived: true },
                });
            }
        }
        res.status(200).json(setting);
    }
    catch (error) {
        console.error("Error toggling setting:", error);
        res.status(500).json({ error: "Failed to toggle setting." });
    }
});
exports.toggleSettings = toggleSettings;
const getSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = yield prisma_1.prisma.setting.findMany();
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch settings" });
    }
});
exports.getSettings = getSettings;
const getActiveRequestCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = yield prisma_1.prisma.noDue.count({
            where: {
                status: "pending",
                request: {
                    isArchived: false,
                },
            },
        });
        res.json({ count });
    }
    catch (error) {
        console.error("Error fetching active request count:", error);
        res.status(500).json({ message: "Failed to fetch active request count" });
    }
});
exports.getActiveRequestCount = getActiveRequestCount;
function getSemesterStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const semesterStats = yield prisma_1.prisma.student.groupBy({
                by: ["currentSemester"],
                _count: {
                    currentSemester: true,
                },
                orderBy: {
                    currentSemester: "asc",
                },
            });
            // Format the result for frontend
            const formatted = semesterStats.map((s) => ({
                semester: s.currentSemester,
                studentCount: s._count.currentSemester,
            }));
            res.json(formatted);
        }
        catch (error) {
            console.error("Error fetching semester stats:", error);
            res.status(500).json({ message: "Failed to fetch semester stats" });
            throw new Error("Failed to fetch semester statistics");
        }
    });
}
function promoteStudents(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { semesters } = req.body;
            if (!Array.isArray(semesters) || semesters.length === 0) {
                return res.status(400).json({ message: "No semesters provided" });
            }
            // Update all students in selected semesters
            const updated = yield prisma_1.prisma.student.updateMany({
                where: {
                    currentSemester: {
                        in: semesters,
                    },
                },
                data: {
                    currentSemester: {
                        increment: 1,
                    },
                },
            });
            res.json({
                message: "Students promoted successfully",
                updatedCount: updated.count,
            });
        }
        catch (error) {
            console.error("Error promoting students:", error);
            res.status(500).json({ message: "Failed to promote students" });
        }
    });
}
