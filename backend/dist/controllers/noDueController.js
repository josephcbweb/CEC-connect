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
exports.sendPendingEmails = exports.bulkClearDues = exports.bulkInitiateCheck = exports.bulkInitiateNoDue = exports.getStudentStatus = exports.clearDue = exports.getPendingApprovals = exports.registerSemester = void 0;
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
                // Fetch configured dues for this semester + student's program
                const dueConfigs = yield tx.dueConfiguration.findMany({
                    where: {
                        semester: targetSemester,
                        program: student.program,
                        isActive: true,
                    },
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
                // Check if due already exists for this specific course
                const existingDue = yield tx.noDue.findFirst({
                    where: {
                        requestId,
                        courseId: course.id,
                    },
                });
                if (!existingDue) {
                    duesToCreate.push({
                        requestId,
                        courseId: course.id,
                        departmentId: course.departmentId,
                        status: enums_1.NoDueStatus.pending,
                        comments: `Course: ${course.name}`, // Keeping for backward compatibility/UI
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
                            course: true,
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
        const { semester, status, search, type, program, departmentId, userId: queryUserId, page = 1, limit = 10, } = req.query;
        // Authorization Check: If userId is provided, check if they are limited to specific courses
        const userId = queryUserId ? Number(queryUserId) : null;
        let isSubjectStaff = false;
        let allowedCourseIds = [];
        if (userId) {
            const staffUser = yield prisma_1.prisma.user.findUnique({
                where: { id: userId },
                include: { courses: true },
            });
            if (staffUser && staffUser.courses && staffUser.courses.length > 0) {
                isSubjectStaff = true;
                allowedCourseIds = staffUser.courses.map((c) => c.id);
            }
        }
        const whereClause = {
            request: {
                isArchived: false,
                student: {
                    status: {
                        notIn: [enums_1.StudentStatus.graduated, enums_1.StudentStatus.deleted],
                    },
                },
            },
        };
        // Filter by semester
        if (semester && semester !== "all") {
            whereClause.request.targetSemester = Number(semester);
        }
        // Filter by student search
        if (search) {
            whereClause.request.student = Object.assign(Object.assign({}, whereClause.request.student), { OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    {
                        admission_number: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ] });
        }
        // Filter by program
        if (program && program !== "all") {
            whereClause.request.student = Object.assign(Object.assign({}, whereClause.request.student), { program: program });
        }
        // Filter by department
        if (departmentId && departmentId !== "all") {
            whereClause.request.student = Object.assign(Object.assign({}, whereClause.request.student), { departmentId: Number(departmentId) });
        }
        // Apply Subject Staff limitation common filter
        if (isSubjectStaff) {
            whereClause.courseId = { in: allowedCourseIds };
        }
        // Filter by status
        if (status === "pending") {
            whereClause.status = "pending";
        }
        else if (status === "cleared") {
            whereClause.status = "cleared";
        }
        // Filter by Due Type (Academic vs Service)
        if (type === "academic") {
            whereClause.departmentId = { not: null };
        }
        else if (type === "service") {
            whereClause.serviceDepartmentId = { not: null };
        }
        // Pagination
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const [total, dues] = yield Promise.all([
            prisma_1.prisma.noDue.count({ where: whereClause }),
            prisma_1.prisma.noDue.findMany({
                where: whereClause,
                include: {
                    request: {
                        include: {
                            student: {
                                include: {
                                    department: true,
                                },
                            },
                        },
                    },
                    department: true,
                    serviceDepartment: true,
                    course: true,
                },
                orderBy: { updatedAt: "desc" },
                skip,
                take,
            }),
        ]);
        const formattedDues = dues.map((due) => {
            var _a, _b, _c, _d;
            let dueType = ((_a = due.course) === null || _a === void 0 ? void 0 : _a.name) ||
                ((_b = due.serviceDepartment) === null || _b === void 0 ? void 0 : _b.name) ||
                ((_c = due.department) === null || _c === void 0 ? void 0 : _c.name) ||
                "Unknown";
            if (due.course) {
                dueType = `${due.course.name} (${due.course.type})`;
            }
            else if (due.comments) {
                dueType = `${dueType} (${due.comments})`;
            }
            return {
                id: due.id,
                requestId: due.requestId,
                studentName: due.request.student.name,
                registerNo: due.request.student.admission_number,
                semester: due.request.targetSemester,
                program: due.request.student.program,
                department: ((_d = due.request.student.department) === null || _d === void 0 ? void 0 : _d.name) || "N/A",
                dueType,
                status: due.status,
                updatedAt: due.updatedAt,
            };
        });
        res.json({
            data: formattedDues,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
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
                        course: true,
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
        const { semester, program } = req.body;
        const targetSemester = Number(semester);
        const targetProgram = program || "BTECH";
        if (!targetSemester) {
            res.status(400).json({ message: "Semester is required" });
            return;
        }
        // 1. Find eligible students
        const students = yield prisma_1.prisma.student.findMany({
            where: {
                currentSemester: targetSemester,
                program: targetProgram,
                status: enums_1.StudentStatus.approved,
            },
        });
        // 2. Find default due configs for this semester + program
        const configs = yield prisma_1.prisma.dueConfiguration.findMany({
            where: {
                semester: targetSemester,
                program: targetProgram,
                isActive: true,
            },
            include: { serviceDepartment: true },
        });
        let count = 0;
        for (const student of students) {
            // 3. Check if already initiated
            const existing = yield prisma_1.prisma.noDueRequest.findFirst({
                where: {
                    studentId: student.id,
                    targetSemester: targetSemester,
                    status: { not: "rejected" },
                },
                include: { noDues: true },
            });
            if (existing && existing.noDues.length > 0) {
                continue; // Already initiated with dues
            }
            let requestId;
            if (existing) {
                requestId = existing.id;
                count++;
            }
            else {
                // Create new request
                const request = yield prisma_1.prisma.noDueRequest.create({
                    data: {
                        studentId: student.id,
                        targetSemester: targetSemester,
                        reason: "Semester Registration (Bulk)",
                        status: "pending",
                    },
                });
                requestId = request.id;
                count++;
            }
            const duesToCreate = [];
            // 4. Default Due entries
            for (const config of configs) {
                if (config.serviceDepartmentId) {
                    duesToCreate.push({
                        requestId,
                        serviceDepartmentId: config.serviceDepartmentId,
                        status: enums_1.NoDueStatus.pending,
                    });
                }
            }
            // 5. Course-based entries
            if (student.departmentId) {
                const courses = yield prisma_1.prisma.course.findMany({
                    where: {
                        semester: targetSemester,
                        departmentId: student.departmentId,
                        isActive: true,
                    },
                });
                for (const course of courses) {
                    duesToCreate.push({
                        requestId,
                        courseId: course.id,
                        departmentId: course.departmentId,
                        status: enums_1.NoDueStatus.pending,
                        comments: `Course: ${course.name}`,
                    });
                }
            }
            if (duesToCreate.length > 0) {
                yield prisma_1.prisma.noDue.createMany({ data: duesToCreate });
            }
            // 6. Queue email
            if (student.email) {
                yield prisma_1.prisma.emailQueue.create({
                    data: {
                        to: student.email,
                        subject: "No Due Clearance Initiated",
                        content: "The due page is open now, you can access it in your student profile to clear your dues.",
                        description: `Bulk initiation for ${targetProgram} Semester ${targetSemester}`,
                        status: "PENDING",
                    },
                });
            }
        }
        res.json({ message: `Initiated for ${count} students` });
    }
    catch (error) {
        console.error("Error bulk initiating:", error);
        res.status(500).json({ message: "Failed to initiate bulk no due" });
    }
});
exports.bulkInitiateNoDue = bulkInitiateNoDue;
// 3.6.1 POST /api/nodue/bulk-initiate-check
const bulkInitiateCheck = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { semester, program } = req.body;
        const targetSemester = Number(semester);
        const targetProgram = program || "BTECH";
        if (!targetSemester) {
            res.status(400).json({ message: "Semester is required" });
            return;
        }
        const totalStudents = yield prisma_1.prisma.student.count({
            where: {
                currentSemester: targetSemester,
                program: targetProgram,
                status: enums_1.StudentStatus.approved,
            },
        });
        const initiatedStudents = yield prisma_1.prisma.student.count({
            where: {
                currentSemester: targetSemester,
                program: targetProgram,
                requests: {
                    some: {
                        targetSemester: targetSemester,
                        status: { not: "rejected" },
                        noDues: { some: {} },
                    },
                },
            },
        });
        res.json({
            total: totalStudents,
            initiated: initiatedStudents,
            toBeInitiated: totalStudents - initiatedStudents,
        });
    }
    catch (error) {
        console.error("Error checking bulk stats:", error);
        res.status(500).json({ message: "Failed to check bulk stats" });
    }
});
exports.bulkInitiateCheck = bulkInitiateCheck;
// 3.8 POST /api/staff/bulk-clear
const bulkClearDues = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { dueIds, userId } = req.body; // Expecting array of due IDs
        if (!dueIds || !Array.isArray(dueIds) || dueIds.length === 0) {
            res.status(400).json({ message: "No due IDs provided" });
            return;
        }
        if (!userId) {
            res.status(400).json({ message: "User ID is required" });
            return;
        }
        // Update all provided dues to cleared
        yield prisma_1.prisma.noDue.updateMany({
            where: {
                id: { in: dueIds },
                status: { not: enums_1.NoDueStatus.cleared },
            },
            data: {
                status: enums_1.NoDueStatus.cleared,
            },
        });
        // Create approval records for audit
        // Note: createMany is supported for top-level models
        const approvalData = dueIds.map((id) => ({
            noDueId: id,
            approverId: Number(userId),
            status: enums_1.ApprovalStatus.approved,
        }));
        yield prisma_1.prisma.noDueApproval.createMany({
            data: approvalData,
        });
        // Check and update Request status for affected requests
        // 1. Find all distinct requests involved
        const affectedDues = yield prisma_1.prisma.noDue.findMany({
            where: { id: { in: dueIds } },
            select: { requestId: true },
        });
        const requestIds = [...new Set(affectedDues.map((d) => d.requestId))];
        // 2. Check each request
        for (const rid of requestIds) {
            const pendingCount = yield prisma_1.prisma.noDue.count({
                where: {
                    requestId: rid,
                    status: { not: enums_1.NoDueStatus.cleared },
                },
            });
            if (pendingCount === 0) {
                yield prisma_1.prisma.noDueRequest.update({
                    where: { id: rid },
                    data: { status: enums_1.RequestStatus.approved },
                });
            }
        }
        res.json({ message: `Successfully cleared ${dueIds.length} dues` });
    }
    catch (error) {
        console.error("Bulk clear error:", error);
        res
            .status(500)
            .json({ message: "Failed to bulk clear dues", error: error.message });
    }
});
exports.bulkClearDues = bulkClearDues;
// 3.9 POST /api/nodue/send-emails
const sendPendingEmails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pendingEmails = yield prisma_1.prisma.emailQueue.findMany({
            where: { status: "PENDING" },
            take: 50, // Process in batches
        });
        if (pendingEmails.length === 0) {
            res.json({ message: "No pending emails to send." });
            return;
        }
        let sentCount = 0;
        let failedCount = 0;
        for (const email of pendingEmails) {
            try {
                // Here you would integrate with your actual email service (e.g., Nodemailer, SendGrid, AWS SES)
                // For now, we simulate sending the email
                console.log(`Sending email to ${email.to}: ${email.subject}`);
                // Simulate async email sending
                yield new Promise((resolve) => setTimeout(resolve, 100));
                yield prisma_1.prisma.emailQueue.update({
                    where: { id: email.id },
                    data: { status: "SENT" },
                });
                sentCount++;
            }
            catch (err) {
                console.error(`Failed to send email to ${email.to}:`, err);
                yield prisma_1.prisma.emailQueue.update({
                    where: { id: email.id },
                    data: { status: "FAILED" },
                });
                failedCount++;
            }
        }
        res.json({
            message: `Processed ${pendingEmails.length} emails.`,
            sent: sentCount,
            failed: failedCount,
        });
    }
    catch (error) {
        console.error("Error sending pending emails:", error);
        res
            .status(500)
            .json({ message: "Failed to send emails", error: error.message });
    }
});
exports.sendPendingEmails = sendPendingEmails;
