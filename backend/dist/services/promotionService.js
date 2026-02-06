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
exports.PromotionService = void 0;
const prisma_1 = require("../lib/prisma");
class PromotionService {
    /**
     * Get current semester type based on current date
     * You can customize this logic based on your academic calendar
     */
    static getCurrentSemesterType() {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        // Assuming:
        // ODD semester: June-November (months 6-11)
        // EVEN semester: December-May (months 12, 1-5)
        if (month >= 6 && month <= 11) {
            return "ODD";
        }
        return "EVEN";
    }
    /**
     * Get semester information
     */
    static getSemesterInfo() {
        return {
            currentSemesterType: this.getCurrentSemesterType(),
            oddSemesters: [1, 3, 5, 7],
            evenSemesters: [2, 4, 6, 8],
        };
    }
    /**
     * Get promotion preview - count students in each semester
     */
    static getPromotionPreview() {
        return __awaiter(this, void 0, void 0, function* () {
            const semesterType = this.getCurrentSemesterType();
            const counts = yield prisma_1.prisma.$transaction([
                prisma_1.prisma.student.count({ where: { currentSemester: 1, status: { not: "graduated" } } }),
                prisma_1.prisma.student.count({ where: { currentSemester: 2, status: { not: "graduated" } } }),
                prisma_1.prisma.student.count({ where: { currentSemester: 3, status: { not: "graduated" } } }),
                prisma_1.prisma.student.count({ where: { currentSemester: 4, status: { not: "graduated" } } }),
                prisma_1.prisma.student.count({ where: { currentSemester: 5, status: { not: "graduated" } } }),
                prisma_1.prisma.student.count({ where: { currentSemester: 6, status: { not: "graduated" } } }),
                prisma_1.prisma.student.count({ where: { currentSemester: 7, status: { not: "graduated" } } }),
                prisma_1.prisma.student.count({ where: { currentSemester: 8, status: { not: "graduated" } } }),
            ]);
            const preview = {
                s1ToS2Count: semesterType === "ODD" ? counts[0] : 0,
                s3ToS4Count: semesterType === "ODD" ? counts[2] : 0,
                s5ToS6Count: semesterType === "ODD" ? counts[4] : 0,
                s7ToS8Count: semesterType === "ODD" ? counts[6] : 0,
                s2ToS3Count: semesterType === "EVEN" ? counts[1] : 0,
                s4ToS5Count: semesterType === "EVEN" ? counts[3] : 0,
                s6ToS7Count: semesterType === "EVEN" ? counts[5] : 0,
                s8ToArchiveCount: semesterType === "EVEN" ? counts[7] : 0,
                totalToPromote: 0,
            };
            if (semesterType === "ODD") {
                preview.totalToPromote = counts[0] + counts[2] + counts[4] + counts[6];
            }
            else {
                preview.totalToPromote = counts[1] + counts[3] + counts[5] + counts[7];
            }
            return preview;
        });
    }
    /**
     * Execute semester promotion
     */
    static promoteStudents(config, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            const semesterType = this.getCurrentSemesterType();
            // Check if a promotion has already been done today to prevent duplicate
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const existingPromotion = yield prisma_1.prisma.promotionHistory.findFirst({
                where: {
                    promotionDate: {
                        gte: today,
                    },
                    semesterType,
                },
            });
            if (existingPromotion) {
                throw new Error("A promotion has already been executed today for this semester type. Please undo it first if you want to redo.");
            }
            const promotedCounts = {};
            yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                if (semesterType === "ODD") {
                    // Odd semester promotions
                    if (config.s1ToS2) {
                        const result = yield tx.student.updateMany({
                            where: { currentSemester: 1, status: { not: "graduated" } },
                            data: { currentSemester: 2 },
                        });
                        promotedCounts.s1ToS2 = result.count;
                    }
                    if (config.s3ToS4) {
                        const result = yield tx.student.updateMany({
                            where: { currentSemester: 3, status: { not: "graduated" } },
                            data: { currentSemester: 4 },
                        });
                        promotedCounts.s3ToS4 = result.count;
                    }
                    if (config.s5ToS6) {
                        const result = yield tx.student.updateMany({
                            where: { currentSemester: 5, status: { not: "graduated" } },
                            data: { currentSemester: 6 },
                        });
                        promotedCounts.s5ToS6 = result.count;
                    }
                    if (config.s7ToS8) {
                        const result = yield tx.student.updateMany({
                            where: { currentSemester: 7, status: { not: "graduated" } },
                            data: { currentSemester: 8 },
                        });
                        promotedCounts.s7ToS8 = result.count;
                    }
                }
                else {
                    // Even semester promotions
                    if (config.s2ToS3) {
                        const result = yield tx.student.updateMany({
                            where: { currentSemester: 2, status: { not: "graduated" } },
                            data: { currentSemester: 3 },
                        });
                        promotedCounts.s2ToS3 = result.count;
                    }
                    if (config.s4ToS5) {
                        const result = yield tx.student.updateMany({
                            where: { currentSemester: 4, status: { not: "graduated" } },
                            data: { currentSemester: 5 },
                        });
                        promotedCounts.s4ToS5 = result.count;
                    }
                    if (config.s6ToS7) {
                        const result = yield tx.student.updateMany({
                            where: { currentSemester: 6, status: { not: "graduated" } },
                            data: { currentSemester: 7 },
                        });
                        promotedCounts.s6ToS7 = result.count;
                    }
                    if (config.s8ToArchive) {
                        // Archive S8 students
                        const s8Students = yield tx.student.findMany({
                            where: { currentSemester: 8, status: { not: "graduated" } },
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                dateOfBirth: true,
                                gender: true,
                                student_phone_number: true,
                                aadhaar_number: true,
                                program: true,
                                departmentId: true,
                                admission_number: true,
                                admission_date: true,
                                passout_year: true,
                                allotted_branch: true,
                            },
                        });
                        // Move to graduated students table
                        for (const student of s8Students) {
                            yield tx.graduatedStudent.create({
                                data: {
                                    originalStudentId: student.id,
                                    name: student.name,
                                    email: student.email,
                                    dateOfBirth: student.dateOfBirth,
                                    gender: student.gender,
                                    student_phone_number: student.student_phone_number,
                                    aadhaar_number: student.aadhaar_number,
                                    program: student.program,
                                    departmentId: student.departmentId,
                                    admission_number: student.admission_number,
                                    admission_date: student.admission_date,
                                    passout_year: student.passout_year || new Date().getFullYear(),
                                    archivedBy: adminId,
                                    allotted_branch: student.allotted_branch,
                                },
                            });
                        }
                        // Update their status to graduated and keep them in student table for now
                        // (or delete them if you prefer)
                        const result = yield tx.student.updateMany({
                            where: { currentSemester: 8, status: { not: "graduated" } },
                            data: { status: "graduated" },
                        });
                        promotedCounts.s8ToArchive = result.count;
                    }
                }
                // Log the promotion in history
                yield tx.promotionHistory.create({
                    data: {
                        semesterType,
                        adminId,
                        promotionDetails: promotedCounts,
                        canUndo: true,
                    },
                });
            }));
            return {
                success: true,
                semesterType,
                promotedCounts,
            };
        });
    }
    /**
     * Get the last promotion history
     */
    static getLastPromotion() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.prisma.promotionHistory.findFirst({
                where: { canUndo: true },
                orderBy: { promotionDate: "desc" },
                include: {
                    admin: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            });
        });
    }
    /**
     * Undo the last promotion
     */
    static undoLastPromotion() {
        return __awaiter(this, void 0, void 0, function* () {
            const lastPromotion = yield this.getLastPromotion();
            if (!lastPromotion) {
                throw new Error("No undoable promotion found");
            }
            const details = lastPromotion.promotionDetails;
            yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                if (lastPromotion.semesterType === "ODD") {
                    // Reverse odd semester promotions
                    if (details.s1ToS2) {
                        yield tx.student.updateMany({
                            where: { currentSemester: 2 },
                            data: { currentSemester: 1 },
                        });
                    }
                    if (details.s3ToS4) {
                        yield tx.student.updateMany({
                            where: { currentSemester: 4 },
                            data: { currentSemester: 3 },
                        });
                    }
                    if (details.s5ToS6) {
                        yield tx.student.updateMany({
                            where: { currentSemester: 6 },
                            data: { currentSemester: 5 },
                        });
                    }
                    if (details.s7ToS8) {
                        yield tx.student.updateMany({
                            where: { currentSemester: 8 },
                            data: { currentSemester: 7 },
                        });
                    }
                }
                else {
                    // Reverse even semester promotions
                    if (details.s2ToS3) {
                        yield tx.student.updateMany({
                            where: { currentSemester: 3 },
                            data: { currentSemester: 2 },
                        });
                    }
                    if (details.s4ToS5) {
                        yield tx.student.updateMany({
                            where: { currentSemester: 5 },
                            data: { currentSemester: 4 },
                        });
                    }
                    if (details.s6ToS7) {
                        yield tx.student.updateMany({
                            where: { currentSemester: 7 },
                            data: { currentSemester: 6 },
                        });
                    }
                    if (details.s8ToArchive) {
                        // Restore graduated students
                        const graduatedStudents = yield tx.graduatedStudent.findMany({
                            where: {
                                graduatedAt: {
                                    gte: new Date(lastPromotion.promotionDate),
                                },
                            },
                        });
                        for (const grad of graduatedStudents) {
                            yield tx.student.updateMany({
                                where: { id: grad.originalStudentId },
                                data: { status: "approved", currentSemester: 8 },
                            });
                        }
                        // Delete from graduated table
                        yield tx.graduatedStudent.deleteMany({
                            where: {
                                graduatedAt: {
                                    gte: new Date(lastPromotion.promotionDate),
                                },
                            },
                        });
                    }
                }
                // Mark promotion as undone
                yield tx.promotionHistory.update({
                    where: { id: lastPromotion.id },
                    data: {
                        canUndo: false,
                        undoAt: new Date(),
                    },
                });
            }));
            return {
                success: true,
                message: "Promotion successfully undone",
            };
        });
    }
}
exports.PromotionService = PromotionService;
