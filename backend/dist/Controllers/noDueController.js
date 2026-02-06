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
exports.bulkInitiateNoDue = exports.getStudentStatus = exports.clearDue = exports.getPendingApprovals = exports.registerSemester = void 0;
const prisma_1 = require("../lib/prisma");
const enums_1 = require("../generated/prisma/enums");
// 3.1 POST /api/nodue/register
const registerSemester = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { studentId, courseIds, targetSemester, hostelService } = req.body;
        studentId = Number(studentId);
        if (!courseIds || !Array.isArray(courseIds)) {
            res.status(400).json({ message: "Invalid course selection" });
            return;
        }
        // Pre-fetch data to reduce transaction time
        const student = yield prisma_1.prisma.student.findUnique({
            where: { id: studentId },
        });
        if (!student) {
            res.status(404).json({ message: "Student not found" });
            return;
        }
        // Use student's current semester if not provided
        if (!targetSemester) {
            targetSemester = student.currentSemester;
        }
        const serviceDepts = yield prisma_1.prisma.serviceDepartment.findMany({
            where: { name: { in: ["Library", "Accounts", "Hostel"] } },
        });
        const libraryDept = serviceDepts.find((d) => d.name === "Library");
        const accountsDept = serviceDepts.find((d) => d.name === "Accounts");
        const hostelDept = serviceDepts.find((d) => d.name === "Hostel");
        // Fetch courses to validate and get details
        const courses = yield prisma_1.prisma.course.findMany({
            where: { id: { in: courseIds } },
            include: { department: true },
        });
        if (courses.length !== courseIds.length) {
            res
                .status(400)
                .json({ message: "One or more selected courses not found" });
            return;
        }
        // Start transaction
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Check for existing pending request
            const existingRequest = yield tx.noDueRequest.findFirst({
                where: {
                    studentId,
                    targetSemester: targetSemester || 1,
                    isArchived: false,
                    status: { not: "rejected" },
                },
            });
            let requestId;
            if (existingRequest) {
                requestId = existingRequest.id;
                // If request exists, we just add to it.
            }
            else {
                // Archive any other pending requests for other semesters if needed (optional logic)
                // For now, let's just create the new one.
                const newRequest = yield tx.noDueRequest.create({
                    data: {
                        studentId,
                        targetSemester: targetSemester || 1,
                        reason: "Semester Registration",
                        status: enums_1.RequestStatus.pending,
                        workflowStatus: enums_1.RequestWorkflowStatus.submitted,
                    },
                });
                requestId = newRequest.id;
            }
            // 3. Link selected courses (avoid duplicates)
            for (const courseId of courseIds) {
                const exists = yield tx.courseSelection.findFirst({
                    where: { requestId, courseId },
                });
                if (!exists) {
                    yield tx.courseSelection.create({
                        data: { requestId, courseId },
                    });
                }
            }
            // 4. Auto-Generate Dues
            const duesToCreate = [];
            // Only generate common dues if it's a NEW request
            if (!existingRequest) {
                // Fetch configured dues for this semester
                const dueConfigs = yield tx.dueConfiguration.findMany({
                    where: { semester: targetSemester, isActive: true },
                });
                for (const config of dueConfigs) {
                    if (config.serviceDepartmentId) {
                        const serviceDept = yield tx.serviceDepartment.findUnique({
                            where: { id: config.serviceDepartmentId },
                        });
                        if ((serviceDept === null || serviceDept === void 0 ? void 0 : serviceDept.name) === "Hostel" && !student.hostel_service) {
                            continue;
                        }
                        duesToCreate.push({
                            requestId,
                            serviceDepartmentId: config.serviceDepartmentId,
                            status: enums_1.NoDueStatus.pending,
                        });
                    }
                }
                // Fallback for legacy/hardcoded if no configs exist?
                if (dueConfigs.length === 0) {
                    if (libraryDept) {
                        duesToCreate.push({
                            requestId,
                            serviceDepartmentId: libraryDept.id,
                            status: enums_1.NoDueStatus.pending,
                        });
                    }
                    if (accountsDept) {
                        duesToCreate.push({
                            requestId,
                            serviceDepartmentId: accountsDept.id,
                            status: enums_1.NoDueStatus.pending,
                        });
                    }
                    if (student.hostel_service && hostelDept) {
                        duesToCreate.push({
                            requestId,
                            serviceDepartmentId: hostelDept.id,
                            status: enums_1.NoDueStatus.pending,
                        });
                    }
                }
            }
            // Academic Departments (Labs, Electives, Theory)
            // Create a separate NoDue entry for EACH selected course to allow granular clearance
            for (const course of courses) {
                // MIGRATION FIX: Check for and remove any "Generic" (Department-level) due for this department
                // This prevents having both a "Grouped" due and "Specific" dues
                const genericDue = yield tx.noDue.findFirst({
                    where: {
                        requestId,
                        departmentId: course.departmentId,
                        comments: null, // Generic dues have no comments
                        status: enums_1.NoDueStatus.pending,
                    },
                });
                if (genericDue) {
                    yield tx.noDue.delete({
                        where: { id: genericDue.id },
                    });
                }
                // Check if due already exists for this specific course (using comments as a tag)
                // We use "Course: <CourseName>" to distinguish them
                const courseTag = `Course: ${course.name}`;
                const existingDue = yield tx.noDue.findFirst({
                    where: {
                        requestId,
                        departmentId: course.departmentId,
                        comments: courseTag,
                    },
                });
                if (!existingDue) {
                    duesToCreate.push({
                        requestId,
                        departmentId: course.departmentId,
                        status: enums_1.NoDueStatus.pending,
                        comments: courseTag, // Store course name to distinguish
                    });
                }
            }
            if (duesToCreate.length > 0) {
                yield tx.noDue.createMany({
                    data: duesToCreate,
                });
            }
            return yield tx.noDueRequest.findUnique({
                where: { id: requestId },
                include: {
                    noDues: {
                        include: {
                            department: true,
                            serviceDepartment: true,
                        },
                    },
                    courseSelections: {
                        include: {
                            course: true,
                        },
                    },
                    student: true,
                },
            });
        }), {
            maxWait: 5000,
            timeout: 10000,
        });
        res
            .status(201)
            .json({ message: "Semester registration successful", request: result });
    }
    catch (error) {
        console.error("Registration error:", error);
        res
            .status(500)
            .json({ message: "Registration failed", error: error.message });
    }
});
exports.registerSemester = registerSemester;
// 3.2 GET /api/staff/approvals
const getPendingApprovals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { semester, status, search, type } = req.query;
        // Build query
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        else {
            whereClause.status = "pending"; // Default to pending
        }
        // Filter by type
        if (type === "academic") {
            whereClause.departmentId = { not: null };
        }
        else if (type === "service") {
            whereClause.serviceDepartmentId = { not: null };
        }
        // Filter by semester (on the Request)
        if (semester) {
            whereClause.request = {
                targetSemester: parseInt(semester),
            };
        }
        // Search by student name or regNo
        if (search) {
            whereClause.request = Object.assign(Object.assign({}, whereClause.request), { student: {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        {
                            admission_number: {
                                contains: search,
                                mode: "insensitive",
                            },
                        }, // Assuming admission_number is regNo
                    ],
                } });
        }
        const approvals = yield prisma_1.prisma.noDue.findMany({
            where: whereClause,
            include: {
                department: true,
                serviceDepartment: true,
                request: {
                    include: {
                        student: true,
                        courseSelections: {
                            include: {
                                course: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });
        // Transform data for frontend
        const formattedApprovals = approvals.map((approval) => {
            var _a, _b;
            let dueType = ((_a = approval.department) === null || _a === void 0 ? void 0 : _a.name) ||
                ((_b = approval.serviceDepartment) === null || _b === void 0 ? void 0 : _b.name) ||
                "Unknown";
            // If comments contain "Course: ", use that as the due type
            if (approval.comments && approval.comments.startsWith("Course: ")) {
                dueType = approval.comments.replace("Course: ", "");
            }
            return {
                id: approval.id,
                studentName: approval.request.student.name,
                registerNo: approval.request.student.admission_number,
                semester: approval.request.targetSemester,
                dueType: dueType,
                status: approval.status,
                courses: approval.request.courseSelections
                    .map((cs) => cs.course)
                    .filter((c) => {
                    // If dueType is a specific course name, only show that course
                    if (approval.comments && approval.comments.startsWith("Course: ")) {
                        return c.name === dueType;
                    }
                    // Otherwise show all courses for the department
                    return c.departmentId === approval.departmentId;
                }),
                updatedAt: approval.updatedAt,
            };
        });
        res.json(formattedApprovals);
    }
    catch (error) {
        console.error("Fetch approvals error:", error);
        res
            .status(500)
            .json({ message: "Failed to fetch approvals", error: error.message });
    }
});
exports.getPendingApprovals = getPendingApprovals;
// Helper to clear a due
const clearDue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // noDueId
        const { userId } = req.body;
        console.log("clearDue called with id:", id, "userId:", userId);
        if (!userId) {
            console.log("userId missing, sending 400");
            res.status(400).json({ message: "User ID is required" });
            return;
        }
        const updatedNoDue = yield prisma_1.prisma.noDue.update({
            where: { id: parseInt(id) },
            data: {
                status: enums_1.NoDueStatus.cleared,
                approvals: {
                    create: {
                        approverId: Number(userId),
                        status: enums_1.ApprovalStatus.approved,
                    },
                },
            },
        });
        // Check if all dues for the request are cleared
        const pendingDues = yield prisma_1.prisma.noDue.count({
            where: {
                requestId: updatedNoDue.requestId,
                status: { not: enums_1.NoDueStatus.cleared },
            },
        });
        console.log(`RequestId: ${updatedNoDue.requestId}, Pending Dues: ${pendingDues}`);
        if (pendingDues === 0) {
            console.log("All dues cleared. Updating request status to approved.");
            yield prisma_1.prisma.noDueRequest.update({
                where: { id: updatedNoDue.requestId },
                data: { status: enums_1.RequestStatus.approved },
            });
        }
        res.json({ message: "Due cleared", noDue: updatedNoDue });
    }
    catch (error) {
        console.error("Error in clearDue:", error);
        if (!res.headersSent) {
            res
                .status(500)
                .json({ message: "Failed to clear due", error: error.message });
        }
    }
});
exports.clearDue = clearDue;
const getStudentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.query;
        if (!studentId) {
            res.status(400).json({ message: "Student ID is required" });
            return;
        }
        const student = yield prisma_1.prisma.student.findUnique({
            where: { id: Number(studentId) },
        });
        if (!student) {
            res.status(404).json({ message: "Student not found" });
            return;
        }
        const latestRequest = yield prisma_1.prisma.noDueRequest.findFirst({
            where: {
                studentId: Number(studentId),
                isArchived: false,
            },
            orderBy: { requestDate: "desc" },
            include: {
                student: true,
                noDues: {
                    include: {
                        department: true,
                        serviceDepartment: true,
                    },
                },
                courseSelections: {
                    include: {
                        course: true,
                    },
                },
            },
        });
        if (!latestRequest) {
            res.json({ status: "none", currentSemester: student.currentSemester });
            return;
        }
        res.json({
            status: "active",
            request: latestRequest,
            currentSemester: student.currentSemester,
        });
    }
    catch (error) {
        console.error("Fetch status error:", error);
        res
            .status(500)
            .json({ message: "Failed to fetch status", error: error.message });
    }
});
exports.getStudentStatus = getStudentStatus;
// 3.6 POST /api/nodue/bulk-initiate
const bulkInitiateNoDue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { semester } = req.body;
        const targetSemester = Number(semester);
        if (!targetSemester) {
            res.status(400).json({ message: "Semester is required" });
            return;
        }
        // Find all students in this semester
        const students = yield prisma_1.prisma.student.findMany({
            where: { currentSemester: targetSemester },
        });
        // Find configs for this semester
        const configs = yield prisma_1.prisma.dueConfiguration.findMany({
            where: { semester: targetSemester, isActive: true },
            include: { serviceDepartment: true },
        });
        let count = 0;
        for (const student of students) {
            // Check if request exists
            const existing = yield prisma_1.prisma.noDueRequest.findFirst({
                where: {
                    studentId: student.id,
                    targetSemester: targetSemester,
                    status: { not: "rejected" },
                },
            });
            if (existing)
                continue;
            // Create Request
            const request = yield prisma_1.prisma.noDueRequest.create({
                data: {
                    studentId: student.id,
                    targetSemester: targetSemester,
                    reason: "Semester Registration (Bulk)",
                    status: "pending",
                },
            });
            // Create NoDue items
            for (const config of configs) {
                if (config.serviceDepartmentId) {
                    yield prisma_1.prisma.noDue.create({
                        data: {
                            requestId: request.id,
                            serviceDepartmentId: config.serviceDepartmentId,
                            status: "pending",
                        },
                    });
                }
            }
            count++;
        }
        res.json({ message: `Initiated for ${count} students` });
    }
    catch (error) {
        console.error("Error bulk initiating:", error);
        res.status(500).json({ message: "Failed to initiate bulk no due" });
    }
});
exports.bulkInitiateNoDue = bulkInitiateNoDue;
