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
exports.updateBusRequestStatus = exports.getBusRequests = exports.archiveFeeBatch = exports.updatePaymentStatus = exports.getBatchDetails = exports.getFeeBatches = exports.assignBusFees = exports.getUniqueSemester = exports.fetchBusStudents = exports.deleteBusStop = exports.addBusStops = exports.getBusDetails = exports.addBus = exports.fetchBus = void 0;
const prisma_1 = require("../lib/prisma");
// import { RequestStatus } from "@prisma/client";
const BUS_FEE_KEY = "BUS_FEE_ENABLED";
const fetchBus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const buses = yield prisma_1.prisma.bus.findMany({
            orderBy: {
                busNumber: "asc",
            },
        });
        return res.status(200).json({
            count: buses.length,
            buses,
        });
    }
    catch (error) {
        console.error("Error fetching buses:", error);
        return res.status(500).json({
            message: "Failed to fetch bus list",
        });
    }
});
exports.fetchBus = fetchBus;
const addBus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Add Bus API hit");
    try {
        const { busNumber, busName, routeName, totalSeats, driverName, driverPhone, registrationNo, } = req.body;
        // 🔹 Basic validation
        if (!busNumber || !totalSeats || !driverName || !driverPhone) {
            return res.status(400).json({
                message: "Required fields are missing",
            });
        }
        if (totalSeats <= 0) {
            return res.status(400).json({
                message: "Total seats must be greater than 0",
            });
        }
        // 🔹 Check for duplicate bus number
        const existingBus = yield prisma_1.prisma.bus.findUnique({
            where: { busNumber },
        });
        if (existingBus) {
            return res.status(409).json({
                message: "Bus with this bus number already exists",
            });
        }
        // 🔹 Create bus
        const bus = yield prisma_1.prisma.bus.create({
            data: {
                busNumber,
                busName,
                routeName,
                totalSeats: Number(totalSeats),
                driverName,
                driverPhone,
                registrationNo,
            },
        });
        return res.status(201).json(bus);
    }
    catch (error) {
        console.error("Error adding bus:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});
exports.addBus = addBus;
const getBusDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const busId = Number(req.params.busId);
        const bus = yield prisma_1.prisma.bus.findUnique({
            where: { id: busId },
            include: {
                stops: {
                    select: {
                        id: true,
                        stopName: true,
                        feeAmount: true,
                    },
                },
                students: {
                    where: {
                        bus_service: true,
                    },
                    include: {
                        department: {
                            select: { name: true },
                        },
                        busStop: {
                            // ✅ THIS WAS MISSING
                            select: {
                                id: true,
                                stopName: true,
                                feeAmount: true,
                            },
                        },
                    },
                },
            },
        });
        if (!bus) {
            return res.status(404).json({ message: "Bus not found" });
        }
        /* ---------------- FORMAT RESPONSE ---------------- */
        const formattedStudents = bus.students.map((student) => {
            var _a, _b;
            return ({
                id: student.id,
                name: student.name,
                student_phone_number: student.student_phone_number,
                department: student.department,
                stopName: ((_a = student.busStop) === null || _a === void 0 ? void 0 : _a.stopName) || "Not Assigned",
                stopFee: ((_b = student.busStop) === null || _b === void 0 ? void 0 : _b.feeAmount) || 0,
            });
        });
        res.status(200).json({
            busId: bus.id,
            busName: bus.busName,
            busNumber: bus.busNumber,
            capacity: bus.totalSeats,
            numberOfStudents: formattedStudents.length,
            registrationNumber: bus.registrationNo,
            driverName: bus.driverName,
            driverPhone: bus.driverPhone,
            status: bus.isActive ? "Active" : "Inactive",
            stops: bus.stops,
            students: formattedStudents,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getBusDetails = getBusDetails;
const addBusStops = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { busId, stops } = req.body;
        if (!busId || !Array.isArray(stops) || stops.length === 0) {
            return res.status(400).json({
                success: false,
                message: "busId and stops array are required",
            });
        }
        const formattedStops = stops.map((stop) => ({
            busId: Number(busId),
            stopName: stop.stopName.trim(),
            feeAmount: Number(stop.feeAmount),
        }));
        const result = yield prisma_1.prisma.busStop.createMany({
            data: formattedStops,
            skipDuplicates: true,
        });
        res.status(201).json({
            success: true,
            message: "Bus stops added successfully",
            insertedCount: result.count,
        });
    }
    catch (error) {
        console.error("Error adding bus stops:", error);
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to add bus stops",
            error: message,
        });
    }
});
exports.addBusStops = addBusStops;
const deleteBusStop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stopId = Number(req.params.id);
        if (isNaN(stopId)) {
            return res.status(400).json({
                message: "Invalid stop ID",
            });
        }
        // 🔍 Check if stop exists
        const existingStop = yield prisma_1.prisma.busStop.findUnique({
            where: { id: stopId },
        });
        if (!existingStop) {
            return res.status(404).json({
                message: "Bus stop not found",
            });
        }
        // 🗑 Delete stop
        yield prisma_1.prisma.busStop.delete({
            where: { id: stopId },
        });
        return res.status(200).json({
            success: true,
            message: "Bus stop deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting bus stop:", error);
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        return res.status(500).json({
            success: false,
            message: "Failed to delete bus stop",
            error: message,
        });
    }
});
exports.deleteBusStop = deleteBusStop;
const fetchBusStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const students = yield prisma_1.prisma.student.findMany({
            where: {
                bus_service: true,
                busId: {
                    not: null,
                },
            },
            select: {
                id: true, // Added ID to select block
                name: true,
                currentSemester: true,
                student_phone_number: true,
                bus: {
                    select: {
                        busName: true,
                    },
                },
                department: {
                    select: {
                        department_code: true,
                    },
                },
            },
        });
        // Converting students to a single level object
        const modifiedStudent = students.map((s) => {
            var _a, _b, _c;
            return ({
                id: s.id, // Included ID here
                name: s.name,
                semester: s.currentSemester,
                phoneNumber: s.student_phone_number,
                busName: (_b = (_a = s.bus) === null || _a === void 0 ? void 0 : _a.busName) !== null && _b !== void 0 ? _b : "No Bus Assigned",
                departmentCode: ((_c = s.department) === null || _c === void 0 ? void 0 : _c.department_code) || "N/A",
            });
        });
        return res.status(200).json(modifiedStudent);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to fetch students" });
    }
});
exports.fetchBusStudents = fetchBusStudents;
const getUniqueSemester = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const semesters = yield prisma_1.prisma.student.groupBy({
            by: ["currentSemester"],
            orderBy: { currentSemester: "asc" },
        });
        res.json(semesters.map((s) => s.currentSemester));
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch semesters" });
    }
});
exports.getUniqueSemester = getUniqueSemester;
const assignBusFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { semester, dueDate, feeName } = req.body;
    try {
        // 1. Validation: Check if there is already an active (unarchived) batch for this semester
        const activeBatchExists = yield prisma_1.prisma.feeDetails.findFirst({
            where: {
                semester: parseInt(semester),
                archived: false,
                feeType: { contains: "Bus Fee" },
            },
        });
        if (activeBatchExists && semester !== "all") {
            return res.status(400).json({
                message: `Cannot assign new fees. Please archive the existing active batch for Semester ${semester} first.`,
            });
        }
        // 2. Fetch students
        const students = yield prisma_1.prisma.student.findMany({
            where: Object.assign({ bus_service: true, busStopId: { not: null } }, (semester !== "all" ? { currentSemester: parseInt(semester) } : {})),
            include: { busStop: true },
        });
        if (!students.length)
            return res.status(404).json({ message: "No students found." });
        // 3. Create records in transaction
        yield prisma_1.prisma.$transaction(students.map((student) => {
            var _a;
            const amount = ((_a = student.busStop) === null || _a === void 0 ? void 0 : _a.feeAmount) || 0;
            return prisma_1.prisma.feeDetails.create({
                data: {
                    studentId: student.id,
                    feeType: feeName,
                    amount,
                    dueDate: new Date(dueDate),
                    semester: student.currentSemester,
                    archived: false, // Default state
                    invoices: {
                        create: {
                            studentId: student.id,
                            amount,
                            dueDate: new Date(dueDate),
                            status: "unpaid",
                            feeStructureId: 2,
                        },
                    },
                },
            });
        }));
        res
            .status(201)
            .json({ message: `Assigned fees to ${students.length} students.` });
    }
    catch (error) {
        res.status(500).json({ error: "Transaction failed." });
    }
});
exports.assignBusFees = assignBusFees;
const getFeeBatches = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const batches = yield prisma_1.prisma.feeDetails.groupBy({
            by: ["feeType", "semester", "dueDate"],
            where: {
                feeType: { contains: "Bus Fee" },
                archived: false, // ONLY fetch active batches
            },
            _count: { id: true },
            orderBy: { dueDate: "desc" },
        });
        const formattedBatches = batches.map((batch, index) => ({
            id: index,
            feeName: batch.feeType,
            semester: batch.semester,
            dueDate: batch.dueDate,
            studentCount: batch._count.id,
        }));
        res.json(formattedBatches);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch active fee batches" });
    }
});
exports.getFeeBatches = getFeeBatches;
// 2. Fetch specific student payment statuses for a chosen group
const getBatchDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { semester, feeName, dueDate } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time for comparison
    try {
        const invoices = yield prisma_1.prisma.invoice.findMany({
            where: {
                dueDate: new Date(dueDate),
                fee: {
                    feeType: feeName,
                    semester: parseInt(semester),
                },
            },
            include: {
                student: {
                    select: {
                        name: true,
                        busStop: { select: { stopName: true } },
                    },
                },
            },
            orderBy: { student: { name: "asc" } },
        });
        // Map the status dynamically based on the current date
        const updatedDetails = invoices.map((inv) => {
            const isPastDue = today > new Date(inv.dueDate);
            let displayStatus = inv.status;
            // If database says unpaid but date is passed, show as overdue
            if (inv.status === "unpaid" && isPastDue) {
                displayStatus = "overdue";
            }
            return Object.assign(Object.assign({}, inv), { status: displayStatus });
        });
        res.json(updatedDetails);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch details" });
    }
});
exports.getBatchDetails = getBatchDetails;
const updatePaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    // Debugging: Log what the backend actually receives
    console.log("Updating Invoice ID:", id, "to Status:", status);
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "Valid Invoice ID is required" });
    }
    try {
        const updatedInvoice = yield prisma_1.prisma.invoice.update({
            where: {
                id: parseInt(id),
            },
            data: {
                status: status, // This must match your Enum (paid, unpaid, etc.)
            },
        });
        res.status(200).json(updatedInvoice);
    }
    catch (error) {
        console.error("Prisma Update Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.updatePaymentStatus = updatePaymentStatus;
const archiveFeeBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { feeName, semester, dueDate } = req.body;
    try {
        // Update all records that belong to this specific "Batch"
        const updateCount = yield prisma_1.prisma.feeDetails.updateMany({
            where: {
                feeType: feeName,
                semester: parseInt(semester),
                dueDate: new Date(dueDate),
                archived: false, // Only update ones that aren't already archived
            },
            data: {
                archived: true,
            },
        });
        if (updateCount.count === 0) {
            return res
                .status(404)
                .json({ message: "No active batch found matching these criteria." });
        }
        res.status(200).json({
            message: `Successfully archived ${updateCount.count} records for ${feeName} (S${semester}).`,
        });
    }
    catch (error) {
        console.error("Archive Error:", error);
        res.status(500).json({ error: "Failed to archive the fee batch." });
    }
});
exports.archiveFeeBatch = archiveFeeBatch;
const getBusRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requests = yield prisma_1.prisma.busRequest.findMany({
            where: { status: "pending" },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        admission_number: true,
                        department: { select: { name: true } },
                    },
                },
                bus: { select: { busName: true, busNumber: true } },
                busStop: { select: { stopName: true, feeAmount: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(requests);
    }
    catch (error) {
        console.error("Error fetching bus requests:", error);
        res.status(500).json({ message: "Failed to fetch bus requests" });
    }
});
exports.getBusRequests = getBusRequests;
const updateBusRequestStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { requestId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    if (!requestId || !status) {
        return res
            .status(400)
            .json({ message: "Request ID and status are required" });
    }
    try {
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Get the request
            const request = yield tx.busRequest.findUnique({
                where: { id: Number(requestId) },
                include: { busStop: true }, // Need fee if we were doing more, but mainly need ids
            });
            if (!request) {
                throw new Error("Request not found");
            }
            if (request.status !== "pending") {
                throw new Error("Request is not pending");
            }
            // 2. Update request status
            const updatedRequest = yield tx.busRequest.update({
                where: { id: Number(requestId) },
                data: { status: status },
            });
            // 3. If approved, update Student record
            if (status === "approved") {
                yield tx.student.update({
                    where: { id: request.studentId },
                    data: {
                        bus_service: true,
                        busId: request.busId,
                        busStopId: request.busStopId,
                    },
                });
            }
            return updatedRequest;
        }));
        res.json({ message: `Request ${status} successfully`, result });
    }
    catch (error) {
        console.error("Error updating bus request:", error);
        res
            .status(500)
            .json({ message: error.message || "Failed to update status" });
    }
});
exports.updateBusRequestStatus = updateBusRequestStatus;
