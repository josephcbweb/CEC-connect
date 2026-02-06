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
exports.getStudentDetails = exports.deleteStudents = exports.fetchAllStudents = exports.fetchStats = void 0;
const prisma_1 = require("../lib/prisma");
const fetchStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalStudents = yield prisma_1.prisma.student.count();
        const departmentStats = yield prisma_1.prisma.department.findMany({
            select: {
                name: true,
                students: {
                    select: {
                        id: true, // Just to count
                    },
                },
            },
        });
        const departmentCounts = departmentStats.map((dept) => ({
            title: dept.name,
            count: dept.students.length,
        }));
        res.json([
            { title: "Total Students", count: totalStudents },
            ...departmentCounts,
        ]);
    }
    catch (error) {
        console.error("Failed to fetch student stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.fetchStats = fetchStats;
const fetchAllStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only fetch students that are approved (active students)
        // Pending students should be viewed in the Admissions section
        const students = yield prisma_1.prisma.student.findMany({
            where: {
                status: "approved", // Only show approved/active students
                classId: { not: null }, // Only show students assigned to a class
            },
            select: {
                id: true,
                name: true,
                program: true,
                admission_date: true,
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
            orderBy: {
                name: "asc",
            },
        });
        const currentYear = new Date().getFullYear();
        const enriched = students.map((student) => {
            var _a, _b, _c;
            const admissionYear = student.admission_date
                ? new Date(student.admission_date).getFullYear()
                : null;
            const year = admissionYear && admissionYear <= currentYear
                ? currentYear - admissionYear + 1
                : null;
            return {
                id: student.id,
                name: student.name,
                program: student.program,
                department: ((_a = student.department) === null || _a === void 0 ? void 0 : _a.department_code) || ((_b = student.department) === null || _b === void 0 ? void 0 : _b.name),
                class: ((_c = student.class) === null || _c === void 0 ? void 0 : _c.name) || null,
                year,
            };
        });
        // ✅ Extract unique programs
        const uniquePrograms = Array.from(new Set(students.map((s) => s.program).filter(Boolean)));
        res.json({
            students: enriched,
            programs: uniquePrograms,
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
        const result = yield prisma_1.prisma.student.deleteMany({
            where: {
                id: { in: ids },
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
                admittedCategory: student.admitted_category,
                admissionQuota: student.admission_quota,
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
