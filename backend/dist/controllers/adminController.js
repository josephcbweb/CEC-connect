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
exports.getStudentDetails = exports.demoteStudents = exports.restoreStudents = exports.deleteStudents = exports.fetchAllStudents = exports.fetchStats = void 0;
const prisma_1 = require("../lib/prisma");
const fetchStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // We removed the 'totalStudents' query to eliminate the "All" section
        const departmentStats = yield prisma_1.prisma.department.findMany({
            select: {
                name: true, // Assuming 'name' holds the complete department name in your DB
                students: {
                    where: {
                        status: {
                            notIn: ["graduated", "deleted"],
                        },
                    },
                    select: {
                        id: true,
                    },
                },
            },
        });
        const departmentCounts = departmentStats.map((dept) => ({
            title: dept.name, // Maps the full department name directly from the database
            count: dept.students.length,
        }));
        // Return only the specific department stats
        res.json(departmentCounts);
    }
    catch (error) {
        console.error("Failed to fetch student stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.fetchStats = fetchStats;
const fetchAllStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const statusFilter = req.query.status;
        let whereCondition = {
            status: "approved",
        };
        if (statusFilter === "graduated") {
            whereCondition = { status: "graduated" };
        }
        else if (statusFilter === "all") {
            whereCondition = {
                status: {
                    notIn: ["graduated", "deleted"],
                },
            };
        }
        const students = yield prisma_1.prisma.student.findMany({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                program: true,
                admission_date: true,
                currentSemester: true,
                passout_year: true,
                department: {
                    select: {
                        name: true,
                        department_code: true,
                    },
                },
                class: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: [{ currentSemester: "asc" }, { name: "asc" }],
        });
        const enriched = students.map((student) => {
            var _a, _b, _c;
            return {
                id: student.id,
                name: student.name,
                program: student.program,
                department: ((_a = student.department) === null || _a === void 0 ? void 0 : _a.department_code) || ((_b = student.department) === null || _b === void 0 ? void 0 : _b.name),
                class: ((_c = student.class) === null || _c === void 0 ? void 0 : _c.name) || null,
                year: student.passout_year,
                currentSemester: student.currentSemester,
            };
        });
        const uniquePrograms = Array.from(new Set(students.map((s) => s.program).filter(Boolean)));
        // NEW: Fetch all available departments directly from the DB
        // This ensures we get all departments for ALL programs, not just the currently filtered students
        const allDepartments = yield prisma_1.prisma.department.findMany({
            select: { name: true },
            orderBy: { name: "asc" }
        });
        const uniqueDepartments = allDepartments.map(dept => dept.name);
        res.json({
            students: enriched,
            programs: uniquePrograms,
            departments: uniqueDepartments, // Send the dynamic list to the frontend
        });
    }
    catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Failed to fetch students" });
    }
});
exports.fetchAllStudents = fetchAllStudents;
const deleteStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid or empty ID list." });
    }
    try {
        // Soft delete: Set status to 'deleted'
        const result = yield prisma_1.prisma.student.updateMany({
            where: {
                id: { in: ids },
            },
            data: {
                status: "deleted",
            },
        });
        return res.status(200).json({
            message: "Students deleted successfully.",
            deletedCount: result.count,
        });
    }
    catch (error) {
        console.error("Error deleting students:", error);
        return res.status(500).json({ error: "Failed to delete students." });
    }
});
exports.deleteStudents = deleteStudents;
const restoreStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid or empty ID list." });
    }
    try {
        const result = yield prisma_1.prisma.student.updateMany({
            where: {
                id: { in: ids },
            },
            data: {
                status: "approved", // Restore to approved
            },
        });
        return res.status(200).json({
            message: "Students restored successfully.",
            restoredCount: result.count,
        });
    }
    catch (error) {
        console.error("Error restoring students:", error);
        return res.status(500).json({ error: "Failed to restore students." });
    }
});
exports.restoreStudents = restoreStudents;
const demoteStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid or empty ID list." });
    }
    try {
        // 1. Fetch students to know their current semester
        const students = yield prisma_1.prisma.student.findMany({
            where: { id: { in: ids } },
            select: { id: true, currentSemester: true },
        });
        const decrement1Ids = [];
        const decrement2Ids = [];
        students.forEach((s) => {
            // User specifications:
            // S4 -> S3 (Dec 1)
            // S6 -> S5 (Dec 1)
            // Implicit/Previous Logic:
            // S5 -> S3 (Dec 2)
            // S7 -> S5 (Dec 2)
            // Generalizing: Even -> Dec 1, Odd -> Dec 2
            if (s.currentSemester % 2 === 0) {
                decrement1Ids.push(s.id);
            }
            else {
                decrement2Ids.push(s.id);
            }
        });
        let count = 0;
        if (decrement1Ids.length > 0) {
            const res1 = yield prisma_1.prisma.student.updateMany({
                where: { id: { in: decrement1Ids } },
                data: { currentSemester: { decrement: 1 } },
            });
            count += res1.count;
        }
        if (decrement2Ids.length > 0) {
            // Prevent decrementing below 1?
            // S1 -> -1? S1 shouldn't be year back usually or handled carefully.
            // Assuming inputs are >= 3 for odd sems based on previous logic.
            const res2 = yield prisma_1.prisma.student.updateMany({
                where: { id: { in: decrement2Ids } },
                data: { currentSemester: { decrement: 2 } },
            });
            count += res2.count;
        }
        return res.status(200).json({
            message: `Processed Year Back for ${count} students.`,
            count: count,
        });
    }
    catch (error) {
        console.error("Error demoting students:", error);
        return res.status(500).json({ error: "Failed to demote students." });
    }
});
exports.demoteStudents = demoteStudents;
const calculateYear = (admissionDate) => {
    if (!admissionDate)
        return null;
    const now = new Date();
    const yearsElapsed = now.getFullYear() - admissionDate.getFullYear() + 1;
    // Adjust if current month is before admission month
    const hasCompletedYear = now.getMonth() >= admissionDate.getMonth() &&
        now.getDate() >= admissionDate.getDate();
    return hasCompletedYear ? yearsElapsed + 1 : yearsElapsed;
};
const getStudentDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const studentId = parseInt(req.params.id);
    if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
    }
    try {
        const student = yield prisma_1.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                department: true, // to get department name
            },
        });
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }
        const response = {
            personalDetails: {
                name: student.name,
                email: student.email,
                dateOfBirth: student.dateOfBirth,
                program: student.program,
                department: ((_a = student.department) === null || _a === void 0 ? void 0 : _a.name) || "Not Assigned",
                year: calculateYear(student.admission_date),
                gender: student.gender,
                bloodGroup: student.blood_group,
                phone: student.student_phone_number,
                permanentAddress: student.permanent_address,
                contactAddress: student.contact_address,
                aadhaarNumber: student.aadhaar_number,
                fatherName: student.fatherName,
                fatherPhone: student.father_phone_number,
                motherName: student.motherName,
                motherPhone: student.mother_phone_number,
                parentEmail: student.parent_email,
                guardianName: student.guardian_name,
                guardianAddress: student.local_guardian_address,
                guardianPhone: student.local_guardian_phone_number,
                admittedCategory: student.admitted_category
            },
            academicDetails: {
                physics: student.physics_score,
                chemistry: student.chemistry_score,
                maths: student.maths_score,
                keamTotal: student.keam_subject_total,
                entranceTotal: student.entrance_total_score,
                previousPercentage: student.previous_degree_cgpa_or_total_marks,
                previousInstitution: student.last_institution,
            },
            bankDetails: {
                accountNumber: student.account_number,
                bankName: student.bank_name,
                bankBranch: student.bank_branch,
            },
        };
        return res.status(200).json(response);
    }
    catch (error) {
        console.error("Error fetching student details:", error);
        return res.status(500).json({ error: "Failed to fetch student details" });
    }
});
exports.getStudentDetails = getStudentDetails;
