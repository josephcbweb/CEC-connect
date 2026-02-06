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
exports.requestBusService = exports.getAllBusRoutes = exports.updateStudentProfile = exports.getStudentProfile = exports.getStudentFeeDetails = exports.getStudents = void 0;
const prisma_1 = require("../lib/prisma");
const getStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.prisma.student.findMany({
        include: {
            department: true,
            invoices: { include: { FeeStructure: true } },
            feeDetails: true,
        },
    });
    res.status(201).json(result);
});
exports.getStudents = getStudents;
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
const getStudentFeeDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentId = parseInt(req.params.id);
        if (isNaN(studentId)) {
            return res.status(400).json({ error: "Invalid student ID provided." });
        }
        const studentWithFees = yield prisma_1.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                invoices: {
                    orderBy: {
                        dueDate: "asc",
                    },
                    include: {
                        fee: true,
                        FeeStructure: true,
                    },
                },
            },
        });
        if (!studentWithFees) {
            return res.status(404).json({ error: "Student not found." });
        }
        res.status(200).json(studentWithFees);
    }
    catch (error) {
        console.error(`Error fetching fee details for student ID ${req.params.id}:`, error);
        res.status(500).json({ error: "Failed to retrieve fee details." });
    }
});
exports.getStudentFeeDetails = getStudentFeeDetails;
const getStudentProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const studentId = parseInt(req.params.id);
    if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
    }
    try {
        const student = yield prisma_1.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                department: true, //to get department name
                bus: true,
                busStop: true,
            },
        });
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }
        // Fetch pending bus request
        const pendingBusRequest = yield prisma_1.prisma.busRequest.findFirst({
            where: {
                studentId: student.id,
                status: "pending",
            },
            include: {
                bus: true,
                busStop: true,
            },
        });
        console.log(student);
        const formattedStudent = {
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
            physics: student.physics_score,
            chemistry: student.chemistry_score,
            maths: student.maths_score,
            keamTotal: student.keam_subject_total,
            entranceTotal: student.entrance_total_score,
            previousPercentage: student.previous_degree_cgpa_or_total_marks,
            previousInstitution: student.last_institution,
            accountNumber: student.account_number,
            bankName: student.bank_name,
            bankBranch: student.bank_branch,
            // Bus Service Info
            bus_service: student.bus_service,
            busDetails: student.bus
                ? {
                    busName: student.bus.busName,
                    busNumber: student.bus.busNumber,
                    stopName: (_b = student.busStop) === null || _b === void 0 ? void 0 : _b.stopName,
                    feeAmount: (_c = student.busStop) === null || _c === void 0 ? void 0 : _c.feeAmount,
                }
                : null,
            pendingBusRequest: pendingBusRequest
                ? {
                    id: pendingBusRequest.id,
                    busName: pendingBusRequest.bus.busName,
                    stopName: pendingBusRequest.busStop.stopName,
                    status: pendingBusRequest.status,
                }
                : null,
        };
        console.log(formattedStudent);
        return res.status(200).json(formattedStudent);
    }
    catch (error) {
        console.log(`Error fetching student details:`, error);
        return res.status(500).json({ error: `Failed to fetch student details` });
    }
});
exports.getStudentProfile = getStudentProfile;
const updateStudentProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const studentId = Number(req.params.id);
        console.log("Hello");
        console.log("BODY:", req.body);
        if (isNaN(studentId)) {
            return res.status(400).json({ message: "Invalid student ID" });
        }
        const { email, phone, permanentAddress, contactAddress, fatherPhone, motherPhone, guardianAddress, accountNumber, bankName, bankBranch, } = req.body;
        const updatedStudent = yield prisma_1.prisma.student.update({
            where: { id: studentId },
            data: {
                email: email || undefined,
                student_phone_number: phone || undefined,
                permanent_address: permanentAddress || undefined,
                contact_address: contactAddress || undefined,
                father_phone_number: fatherPhone || undefined,
                mother_phone_number: motherPhone || undefined,
                local_guardian_address: guardianAddress || undefined,
                account_number: accountNumber || undefined,
                bank_name: bankName || undefined,
                bank_branch: bankBranch || undefined,
            },
        });
        res.json({
            message: "Profile updated successfully",
            student: updatedStudent,
        });
    }
    catch (error) {
        console.error(error);
        // Prisma unique constraint (email / phone / account number)
        if (error.code === "P2002") {
            return res.status(409).json({
                message: `Duplicate value for field: ${(_a = error.meta) === null || _a === void 0 ? void 0 : _a.target}`,
            });
        }
        res.status(500).json({
            message: "Failed to update profile",
        });
    }
});
exports.updateStudentProfile = updateStudentProfile;
const getAllBusRoutes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const routes = yield prisma_1.prisma.bus.findMany({
            where: { isActive: true },
            include: {
                stops: {
                    select: {
                        id: true,
                        stopName: true,
                        feeAmount: true,
                    },
                },
            },
        });
        res.status(200).json(routes);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch bus routes" });
    }
});
exports.getAllBusRoutes = getAllBusRoutes;
const requestBusService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId, busId, busStopId } = req.body;
        if (!studentId || !busId || !busStopId) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        // Check if request already exists
        const existingRequest = yield prisma_1.prisma.busRequest.findFirst({
            where: {
                studentId: Number(studentId),
                status: "pending",
            },
        });
        if (existingRequest) {
            return res
                .status(409)
                .json({ message: "You already have a pending request." });
        }
        const request = yield prisma_1.prisma.busRequest.create({
            data: {
                studentId: Number(studentId),
                busId: Number(busId),
                busStopId: Number(busStopId),
                status: "pending",
            },
        });
        res
            .status(201)
            .json({ message: "Bus service requested successfully", request });
    }
    catch (error) {
        console.error("Error requesting bus service:", error);
        res.status(500).json({ message: "Failed to request bus service" });
    }
});
exports.requestBusService = requestBusService;
