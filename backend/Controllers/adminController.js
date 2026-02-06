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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentDetails = exports.deleteStudents = exports.fetchAllStudents = exports.fetchStats = void 0;
var prisma_1 = require("../lib/prisma");
var fetchStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var totalStudents, departmentStats, departmentCounts, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, prisma_1.prisma.student.count()];
            case 1:
                totalStudents = _a.sent();
                return [4 /*yield*/, prisma_1.prisma.department.findMany({
                        select: {
                            name: true,
                            students: {
                                select: {
                                    id: true, // Just to count
                                },
                            },
                        },
                    })];
            case 2:
                departmentStats = _a.sent();
                departmentCounts = departmentStats.map(function (dept) { return ({
                    title: dept.name,
                    count: dept.students.length,
                }); });
                res.json(__spreadArray([
                    { title: "Total Students", count: totalStudents }
                ], departmentCounts, true));
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error("Failed to fetch student stats:", error_1);
                res.status(500).json({ message: "Internal server error" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.fetchStats = fetchStats;
var fetchAllStudents = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var students, currentYear_1, enriched, uniquePrograms, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma_1.prisma.student.findMany({
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
                    })];
            case 1:
                students = _a.sent();
                currentYear_1 = new Date().getFullYear();
                enriched = students.map(function (student) {
                    var _a, _b, _c;
                    var admissionYear = student.admission_date
                        ? new Date(student.admission_date).getFullYear()
                        : null;
                    var year = admissionYear && admissionYear <= currentYear_1
                        ? currentYear_1 - admissionYear + 1
                        : null;
                    return {
                        id: student.id,
                        name: student.name,
                        program: student.program,
                        department: ((_a = student.department) === null || _a === void 0 ? void 0 : _a.department_code) || ((_b = student.department) === null || _b === void 0 ? void 0 : _b.name),
                        class: ((_c = student.class) === null || _c === void 0 ? void 0 : _c.name) || null,
                        year: year,
                    };
                });
                uniquePrograms = Array.from(new Set(students.map(function (s) { return s.program; }).filter(Boolean)));
                res.json({
                    students: enriched,
                    programs: uniquePrograms,
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error("Error fetching students:", error_2);
                res.status(500).json({ error: "Failed to fetch students" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.fetchAllStudents = fetchAllStudents;
var deleteStudents = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var ids, result, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ids = req.body.ids;
                if (!Array.isArray(ids) || ids.length === 0) {
                    return [2 /*return*/, res.status(400).json({ error: "Invalid or empty ID list." })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, prisma_1.prisma.student.deleteMany({
                        where: {
                            id: { in: ids },
                        },
                    })];
            case 2:
                result = _a.sent();
                return [2 /*return*/, res.status(200).json({
                        message: "Students deleted successfully.",
                        deletedCount: result.count,
                    })];
            case 3:
                error_3 = _a.sent();
                console.error("Error deleting students:", error_3);
                return [2 /*return*/, res.status(500).json({ error: "Failed to delete students." })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteStudents = deleteStudents;
var calculateYear = function (admissionDate) {
    if (!admissionDate)
        return null;
    var now = new Date();
    var yearsElapsed = now.getFullYear() - admissionDate.getFullYear() + 1;
    // Adjust if current month is before admission month
    var hasCompletedYear = now.getMonth() >= admissionDate.getMonth() &&
        now.getDate() >= admissionDate.getDate();
    return hasCompletedYear ? yearsElapsed + 1 : yearsElapsed;
};
var getStudentDetails = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var studentId, student, response, error_4;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                studentId = parseInt(req.params.id);
                if (isNaN(studentId)) {
                    return [2 /*return*/, res.status(400).json({ error: "Invalid student ID" })];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, prisma_1.prisma.student.findUnique({
                        where: { id: studentId },
                        include: {
                            department: true, // to get department name
                        },
                    })];
            case 2:
                student = _b.sent();
                if (!student) {
                    return [2 /*return*/, res.status(404).json({ error: "Student not found" })];
                }
                response = {
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
                return [2 /*return*/, res.status(200).json(response)];
            case 3:
                error_4 = _b.sent();
                console.error("Error fetching student details:", error_4);
                return [2 /*return*/, res.status(500).json({ error: "Failed to fetch student details" })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getStudentDetails = getStudentDetails;
