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
exports.getStudentHostelLedger = exports.vacateStudent = exports.generateMonthlyInvoices = exports.updateRent = exports.updateWarden = exports.getAllHostels = exports.getHostelStudents = exports.assignStudentToHostel = exports.createHostel = void 0;
const prisma_1 = require("../lib/prisma");
const createHostel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, wardenName, wardenPhone, monthlyRent } = req.body;
        const hostel = yield prisma_1.prisma.hostel.create({
            data: {
                name,
                wardenName,
                wardenPhone,
                monthlyRent: monthlyRent ? Number(monthlyRent) : 0 // Ensure it's a number
            },
        });
        return res.status(201).json({
            success: true,
            message: "Hostel created with rent configuration",
            data: hostel
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
});
exports.createHostel = createHostel;
const assignStudentToHostel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId, hostelId } = req.body;
        if (!studentId || !hostelId) {
            return res.status(400).json({ success: false, message: "Student ID and Hostel ID are required." });
        }
        // Increased timeout settings to prevent P2028 errors
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Update the Student record
            const student = yield tx.student.update({
                where: { id: Number(studentId) },
                data: {
                    hostelId: Number(hostelId),
                    hostel_service: true
                },
            });
            // 2. Create the HostelHistory record
            const history = yield tx.hostelHistory.create({
                data: {
                    studentId: Number(studentId),
                    hostelId: Number(hostelId),
                    checkInDate: new Date(),
                    status: "ACTIVE",
                },
            });
            return { student, history };
        }), {
            maxWait: 10000, // 10s to wait for a connection
            timeout: 20000 // 20s for the transaction to complete
        });
        return res.status(200).json({
            success: true,
            message: "Student successfully assigned to hostel.",
            data: result
        });
    }
    catch (error) {
        console.error("Assignment Error:", error);
        // Check for specific Prisma errors
        if (error.code === 'P2028') {
            return res.status(504).json({ success: false, error: "Database transaction timed out. Please try again." });
        }
        return res.status(400).json({
            success: false,
            error: "Failed to assign student. Ensure the student and hostel exist."
        });
    }
});
exports.assignStudentToHostel = assignStudentToHostel;
const getHostelStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const hostelData = yield prisma_1.prisma.hostel.findUnique({
            where: { id: Number(id) },
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        student_phone_number: true,
                        currentSemester: true,
                        class: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!hostelData) {
            return res.status(404).json({ success: false, message: "Hostel not found" });
        }
        // Flattening the class name for a cleaner API response
        const formattedStudents = hostelData.students.map(student => {
            var _a;
            return ({
                id: student.id,
                name: student.name,
                phone: student.student_phone_number,
                semester: student.currentSemester,
                className: ((_a = student.class) === null || _a === void 0 ? void 0 : _a.name) || "Not Assigned",
            });
        });
        return res.status(200).json({
            success: true,
            hostelName: hostelData.name,
            warden: hostelData.wardenName,
            wardenPhone: hostelData.wardenPhone, // Add this
            monthlyRent: hostelData.monthlyRent, // Add this
            students: formattedStudents
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});
exports.getHostelStudents = getHostelStudents;
const getAllHostels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hostels = yield prisma_1.prisma.hostel.findMany({
            select: {
                id: true,
                name: true,
                wardenName: true,
                wardenPhone: true,
                monthlyRent: true, // ADD THIS LINE
                _count: { select: { students: true } },
            },
        });
        return res.status(200).json({ success: true, data: hostels });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});
exports.getAllHostels = getAllHostels;
// Update Warden Name and Phone
const updateWarden = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { wardenName, wardenPhone } = req.body;
        yield prisma_1.prisma.hostel.update({
            where: { id: Number(id) },
            data: { wardenName, wardenPhone },
        });
        return res.status(200).json({ success: true, message: "Warden updated successfully" });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
});
exports.updateWarden = updateWarden;
// Update Monthly Rent
const updateRent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { monthlyRent } = req.body;
        yield prisma_1.prisma.hostel.update({
            where: { id: Number(id) },
            data: { monthlyRent: Number(monthlyRent) },
        });
        return res.status(200).json({ success: true, message: "Rent updated successfully" });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
});
exports.updateRent = updateRent;
const generateMonthlyInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Destructure month, year, and the new dueDate from the frontend request
        const { month, year, dueDate } = req.body;
        if (!dueDate) {
            return res.status(400).json({ success: false, message: "Due date is required." });
        }
        // Convert the incoming date string into a JS Date object
        const finalDueDate = new Date(dueDate);
        // 2. Fetch all active hostel residents
        const residents = yield prisma_1.prisma.student.findMany({
            where: {
                hostel_service: true,
                status: { not: 'graduated' },
                hostelId: { not: null }
            },
            include: { hostel: true }
        });
        if (residents.length === 0) {
            return res.status(404).json({ success: false, message: "No active residents found to bill." });
        }
        // 3. Transaction: Create FeeDetail and Invoice for each resident
        const result = yield prisma_1.prisma.$transaction(residents.map((student) => {
            var _a, _b;
            return prisma_1.prisma.feeDetails.create({
                data: {
                    studentId: student.id,
                    feeType: `HOSTEL_RENT_${month.toUpperCase()}_${year}`,
                    amount: ((_a = student.hostel) === null || _a === void 0 ? void 0 : _a.monthlyRent) || 0,
                    dueDate: finalDueDate, // Using the date provided by admin
                    semester: student.currentSemester,
                    invoices: {
                        create: {
                            studentId: student.id,
                            amount: ((_b = student.hostel) === null || _b === void 0 ? void 0 : _b.monthlyRent) || 0,
                            dueDate: finalDueDate, // Using the date provided by admin
                            status: 'unpaid'
                        }
                    }
                }
            });
        }));
        return res.status(201).json({
            success: true,
            message: `Successfully generated ${result.length} invoices for ${month} ${year}.`
        });
    }
    catch (error) {
        console.error("Invoicing Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});
exports.generateMonthlyInvoices = generateMonthlyInvoices;
const vacateStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        // 1. Fetch all unpaid/overdue hostel invoices for this student
        const pendingInvoices = yield prisma_1.prisma.invoice.findMany({
            where: {
                studentId: Number(studentId),
                status: { in: ['unpaid', 'overdue'] },
                // Ensure we only look at hostel rent, not academic fees
                fee: { feeType: { contains: 'HOSTEL_RENT' } }
            }
        });
        // 2. If dues are found, calculate the total and block vacation
        if (pendingInvoices.length > 0) {
            const totalDue = pendingInvoices.reduce((acc, inv) => acc + Number(inv.amount), 0);
            return res.status(400).json({
                success: false,
                message: "Action Blocked: Outstanding dues found.",
                totalDue: totalDue // This is what the frontend modal uses
            });
        }
        // 3. Perform Vacation Transaction (Atomically update Student and History)
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Remove hostel association from Student record
            yield tx.student.update({
                where: { id: Number(studentId) },
                data: {
                    hostelId: null,
                    hostel_service: false
                }
            });
            // Mark the active history record as VACATED
            yield tx.hostelHistory.updateMany({
                where: {
                    studentId: Number(studentId),
                    status: 'ACTIVE'
                },
                data: {
                    vacatedDate: new Date(),
                    status: 'VACATED'
                }
            });
        }), {
            maxWait: 5000,
            timeout: 10000
        });
        return res.status(200).json({
            success: true,
            message: "Student has been vacated successfully."
        });
    }
    catch (error) {
        console.error("Vacate Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});
exports.vacateStudent = vacateStudent;
const getStudentHostelLedger = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const ledger = yield prisma_1.prisma.invoice.findMany({
            where: {
                studentId: Number(studentId),
                fee: { feeType: { contains: 'HOSTEL' } }
            },
            include: {
                payments: true,
                fee: { select: { feeType: true, createdAt: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ success: true, data: ledger });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});
exports.getStudentHostelLedger = getStudentHostelLedger;
