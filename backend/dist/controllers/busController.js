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
exports.getBusInvoices = exports.verifyBusPayment = exports.updateBusRequestStatus = exports.getBusRequests = exports.archiveFeeBatch = exports.updatePaymentStatus = exports.getBatchDetails = exports.getFeeBatches = exports.getSemesterBillingStatus = exports.assignBulkBusFees = exports.previewBulkBusFees = exports.getActiveBusSemesters = exports.fetchBusStudents = exports.deleteBusStop = exports.addBusStops = exports.getBusDetails = exports.addBus = exports.fetchBus = void 0;
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
// ─── Helper: Identify unique batches from bus-service students for a given semester ───
function identifyBatchesForSemester(semester, tx) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const db = tx || prisma_1.prisma;
        const students = yield db.student.findMany({
            where: {
                bus_service: true,
                currentSemester: semester,
                classId: { not: null },
                busStopId: { not: null },
            },
            select: {
                id: true,
                class: {
                    select: {
                        batchDepartment: {
                            select: {
                                batch: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
        });
        // Extract unique batch IDs and names
        const batchMap = new Map();
        for (const s of students) {
            const batch = (_b = (_a = s.class) === null || _a === void 0 ? void 0 : _a.batchDepartment) === null || _b === void 0 ? void 0 : _b.batch;
            if (batch && !batchMap.has(batch.id)) {
                batchMap.set(batch.id, batch.name);
            }
        }
        return Array.from(batchMap.entries()).map(([id, name]) => ({ id, name }));
    });
}
// ─── 1. GET /active-semesters ───
const getActiveBusSemesters = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const semesters = yield prisma_1.prisma.student.groupBy({
            by: ["currentSemester"],
            where: { bus_service: true },
            orderBy: { currentSemester: "asc" },
        });
        res.json(semesters.map((s) => s.currentSemester));
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch active semesters" });
    }
});
exports.getActiveBusSemesters = getActiveBusSemesters;
// ─── 2. GET /preview-bulk-fees?semester=X ───
// Returns student-level counts: eligible, alreadyBilled, netNew + batch breakdown
const previewBulkBusFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const semester = parseInt(req.query.semester);
    if (isNaN(semester)) {
        return res.status(400).json({ error: "Valid semester is required" });
    }
    try {
        // 1. All eligible bus-service students for this semester
        const allEligible = yield prisma_1.prisma.student.findMany({
            where: {
                bus_service: true,
                currentSemester: semester,
                busStopId: { not: null },
                classId: { not: null },
            },
            select: { id: true },
        });
        const eligibleIds = allEligible.map((s) => s.id);
        // 2. Student-level check: who already has a "Bus Fee" record for this semester?
        const alreadyBilledRecords = yield prisma_1.prisma.feeDetails.findMany({
            where: {
                studentId: { in: eligibleIds },
                semester,
                feeType: { contains: "Bus Fee" },
                archived: false,
            },
            select: { studentId: true },
            distinct: ["studentId"],
        });
        const alreadyBilledIds = new Set(alreadyBilledRecords.map((r) => r.studentId));
        const eligible = eligibleIds.length;
        const alreadyBilled = alreadyBilledIds.size;
        const netNew = eligible - alreadyBilled;
        // 3. Batch breakdown for display
        const batches = yield identifyBatchesForSemester(semester);
        const batchDetails = [];
        for (const batch of batches) {
            const batchStudents = yield prisma_1.prisma.student.findMany({
                where: {
                    bus_service: true,
                    currentSemester: semester,
                    busStopId: { not: null },
                    class: { batchDepartment: { batchId: batch.id } },
                },
                select: { id: true },
            });
            const totalInBatch = batchStudents.length;
            const billedInBatch = batchStudents.filter((s) => alreadyBilledIds.has(s.id)).length;
            batchDetails.push({
                batchId: batch.id,
                batchName: batch.name,
                total: totalInBatch,
                alreadyBilled: billedInBatch,
                netNew: totalInBatch - billedInBatch,
            });
        }
        res.json({ eligible, alreadyBilled, netNew, batches: batchDetails });
    }
    catch (error) {
        console.error("Preview error:", error);
        res.status(500).json({ error: "Failed to generate preview" });
    }
});
exports.previewBulkBusFees = previewBulkBusFees;
// ─── 3. POST /assign-bulk-fees ───
// Student-level dedup: skips individual students who already have a Bus Fee for this semester
const assignBulkBusFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { semester, dueDate } = req.body;
    const targetSemester = parseInt(semester);
    if (isNaN(targetSemester) || !dueDate) {
        return res.status(400).json({ error: "semester and dueDate are required" });
    }
    try {
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            // 1. Identify batches
            const batches = yield identifyBatchesForSemester(targetSemester, tx);
            if (batches.length === 0) {
                throw new Error("No batches found with bus-service students for this semester.");
            }
            // 2. Get ALL eligible students across all batches
            const allStudents = yield tx.student.findMany({
                where: {
                    bus_service: true,
                    currentSemester: targetSemester,
                    busStopId: { not: null },
                    classId: { not: null },
                },
                select: { id: true },
            });
            // 3. Student-level double-bill check
            const existingFees = yield tx.feeDetails.findMany({
                where: {
                    studentId: { in: allStudents.map((s) => s.id) },
                    semester: targetSemester,
                    feeType: { contains: "Bus Fee" },
                    archived: false,
                },
                select: { studentId: true },
                distinct: ["studentId"],
            });
            const alreadyBilledIds = new Set(existingFees.map((f) => f.studentId));
            let totalStudentsBilled = 0;
            let totalSkipped = 0;
            const processedBatchNames = [];
            const feeName = `Bus Fee - Sem ${targetSemester}`;
            const dueDateObj = new Date(dueDate);
            // 4. Process each batch
            for (const batch of batches) {
                // 4a. Upsert BusFeeAssignment (idempotent master record)
                const assignment = yield tx.busFeeAssignment.upsert({
                    where: {
                        batchId_semester: {
                            batchId: batch.id,
                            semester: targetSemester,
                        },
                    },
                    update: {}, // No-op if already exists
                    create: {
                        batchId: batch.id,
                        semester: targetSemester,
                        dueDate: dueDateObj,
                    },
                });
                // 4b. Fetch students for this batch + semester
                const students = yield tx.student.findMany({
                    where: {
                        bus_service: true,
                        currentSemester: targetSemester,
                        busStopId: { not: null },
                        class: { batchDepartment: { batchId: batch.id } },
                    },
                    include: { busStop: true },
                });
                // 4c. Create FeeDetails + Invoice only for non-billed students
                let batchBilled = 0;
                for (const student of students) {
                    if (alreadyBilledIds.has(student.id)) {
                        totalSkipped++;
                        continue; // Student-level skip
                    }
                    const amount = ((_a = student.busStop) === null || _a === void 0 ? void 0 : _a.feeAmount) || 0;
                    yield tx.feeDetails.create({
                        data: {
                            studentId: student.id,
                            feeType: feeName,
                            amount,
                            dueDate: dueDateObj,
                            semester: targetSemester,
                            archived: false,
                            busFeeAssignmentId: assignment.id,
                            invoices: {
                                create: {
                                    studentId: student.id,
                                    amount,
                                    dueDate: dueDateObj,
                                    status: "unpaid",
                                    semester: targetSemester,
                                },
                            },
                        },
                    });
                    batchBilled++;
                }
                totalStudentsBilled += batchBilled;
                if (batchBilled > 0)
                    processedBatchNames.push(batch.name);
            }
            if (totalStudentsBilled === 0) {
                throw new Error("All students for this semester are already up to date.");
            }
            return {
                totalStudentsBilled,
                totalSkipped,
                processedBatches: processedBatchNames,
            };
        }));
        res.status(201).json(Object.assign({ message: `Assigned fees to ${result.totalStudentsBilled} students across ${result.processedBatches.length} batch(es). ${result.totalSkipped} student(s) skipped (already billed).` }, result));
    }
    catch (error) {
        console.error("Bulk fee assignment error:", error);
        res.status(500).json({ error: error.message || "Transaction failed." });
    }
});
exports.assignBulkBusFees = assignBulkBusFees;
// ─── 4. GET /semester-status?semester=X ───
// Unified view: merges student data with bus-fee invoice status for a semester
const getSemesterBillingStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const semester = parseInt(req.query.semester);
    if (isNaN(semester)) {
        return res.status(400).json({ error: "Valid semester is required" });
    }
    try {
        // 1. Fetch all bus-service students for this semester with joins
        const students = yield prisma_1.prisma.student.findMany({
            where: {
                bus_service: true,
                currentSemester: semester,
            },
            select: {
                id: true,
                name: true,
                admission_number: true,
                busStop: {
                    select: { stopName: true, feeAmount: true },
                },
                class: {
                    select: {
                        batchDepartment: {
                            select: {
                                batch: { select: { name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { name: "asc" },
        });
        // 2. Get all bus-fee invoices for these students in this semester
        const studentIds = students.map((s) => s.id);
        const invoices = yield prisma_1.prisma.invoice.findMany({
            where: {
                studentId: { in: studentIds },
                fee: {
                    feeType: { contains: "Bus Fee" },
                    semester,
                    archived: false,
                },
            },
            select: {
                id: true,
                studentId: true,
                amount: true,
                status: true,
                dueDate: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
        // 3. Map: studentId → latest invoice
        const invoiceMap = new Map();
        for (const inv of invoices) {
            if (!invoiceMap.has(inv.studentId)) {
                invoiceMap.set(inv.studentId, inv); // latest first (ordered by createdAt desc)
            }
        }
        // 4. Build unified response
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = students.map((student) => {
            var _a, _b, _c, _d, _e;
            const invoice = invoiceMap.get(student.id);
            let status = "not_billed";
            if (invoice) {
                if (invoice.status === "paid") {
                    status = "paid";
                }
                else if (invoice.status === "unpaid") {
                    status = today > new Date(invoice.dueDate) ? "overdue" : "unpaid";
                }
                else {
                    status = invoice.status;
                }
            }
            return {
                studentId: student.id,
                name: student.name,
                admissionNumber: student.admission_number || "N/A",
                batchName: ((_c = (_b = (_a = student.class) === null || _a === void 0 ? void 0 : _a.batchDepartment) === null || _b === void 0 ? void 0 : _b.batch) === null || _c === void 0 ? void 0 : _c.name) || "Unassigned",
                stopName: ((_d = student.busStop) === null || _d === void 0 ? void 0 : _d.stopName) || "N/A",
                feeAmount: ((_e = student.busStop) === null || _e === void 0 ? void 0 : _e.feeAmount) || 0,
                status,
                invoiceId: (invoice === null || invoice === void 0 ? void 0 : invoice.id) || null,
                invoiceAmount: (invoice === null || invoice === void 0 ? void 0 : invoice.amount) || null,
                dueDate: (invoice === null || invoice === void 0 ? void 0 : invoice.dueDate) || null,
            };
        });
        // 5. Counts
        const counts = {
            total: result.length,
            notBilled: result.filter((r) => r.status === "not_billed").length,
            unpaid: result.filter((r) => r.status === "unpaid" || r.status === "overdue").length,
            paid: result.filter((r) => r.status === "paid").length,
        };
        res.json({ students: result, counts });
    }
    catch (error) {
        console.error("Semester status error:", error);
        res.status(500).json({ error: "Failed to fetch semester billing status" });
    }
});
exports.getSemesterBillingStatus = getSemesterBillingStatus;
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
    try {
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            // 1. Fetch the request AND the student's current semester
            const request = yield tx.busRequest.findUnique({
                where: { id: Number(requestId) },
                include: {
                    busStop: true,
                    student: {
                        select: {
                            currentSemester: true, // Dynamically get the semester
                        }
                    }
                },
            });
            if (!request || request.status !== "pending") {
                throw new Error("Invalid or non-pending request");
            }
            // 2. Update request status
            const updatedRequest = yield tx.busRequest.update({
                where: { id: Number(requestId) },
                data: { status: status },
            });
            // 3. If approved, Create an UNPAID Invoice with dynamic semester
            if (status === "approved") {
                yield tx.feeDetails.create({
                    data: {
                        studentId: request.studentId,
                        feeType: "Bus Fee - Enrollment",
                        amount: request.busStop.feeAmount,
                        dueDate: new Date(),
                        semester: (_b = (_a = request.student) === null || _a === void 0 ? void 0 : _a.currentSemester) !== null && _b !== void 0 ? _b : 1,
                        invoices: {
                            create: {
                                studentId: request.studentId,
                                amount: request.busStop.feeAmount,
                                dueDate: new Date(),
                                status: "unpaid",
                                feeStructureId: 3,
                                semester: (_d = (_c = request.student) === null || _c === void 0 ? void 0 : _c.currentSemester) !== null && _d !== void 0 ? _d : 1,
                            },
                        },
                    },
                });
            }
            return updatedRequest;
        }));
        res.json({ message: `Request ${status}. Fee assigned for Semester ${result.status === 'approved' ? 'current' : 'N/A'}.`, result });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateBusRequestStatus = updateBusRequestStatus;
const verifyBusPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { invoiceId } = req.params;
    try {
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Update Invoice to 'paid'
            const invoice = yield tx.invoice.update({
                where: { id: Number(invoiceId) },
                data: { status: "paid" },
                include: {
                    student: true,
                    // We need to find the original BusRequest to get the BusID and StopID
                    // Since it's not directly linked, we search for an approved request for this student
                }
            });
            const busRequest = yield tx.busRequest.findFirst({
                where: {
                    studentId: invoice.studentId,
                    status: "approved"
                },
                orderBy: { createdAt: 'desc' }
            });
            if (!busRequest)
                throw new Error("No approved bus request found for this student.");
            // 2. NOW set bus_service to true and assign IDs
            const updatedStudent = yield tx.student.update({
                where: { id: invoice.studentId },
                data: {
                    bus_service: true,
                    busId: busRequest.busId,
                    busStopId: busRequest.busStopId,
                },
            });
            return { invoice, updatedStudent };
        }));
        res.json({ message: "Payment verified. Bus service activated.", result });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.verifyBusPayment = verifyBusPayment;
const getBusInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status } = req.query;
    try {
        const invoices = yield prisma_1.prisma.invoice.findMany({
            where: Object.assign(Object.assign({}, (status ? { status: status } : {})), { 
                // We specifically want bus-related fees
                fee: {
                    feeType: {
                        contains: "Bus Fee",
                        mode: 'insensitive' // Makes it search for "bus fee", "Bus Fee", etc.
                    }
                } }),
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        admission_number: true,
                        department: {
                            select: { name: true }
                        },
                        // We need the bus stop to show the admin where the student is traveling
                        busStop: {
                            select: { stopName: true, feeAmount: true }
                        }
                    }
                },
                fee: {
                    select: {
                        feeType: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.status(200).json(invoices);
    }
    catch (error) {
        console.error("Error fetching bus invoices:", error);
        return res.status(500).json({ message: "Failed to fetch invoices" });
    }
});
exports.getBusInvoices = getBusInvoices;
