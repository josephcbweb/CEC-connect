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
exports.markInvoiceAsPaid = exports.assignFeeToStudents = exports.deleteFeeStructure = exports.updateFeeStructure = exports.getAllFeeStructures = exports.getAllInvoices = exports.createFeeStructure = void 0;
const prisma_1 = require("../lib/prisma");
const enums_1 = require("../generated/prisma/enums");
// --- Fee Structure CRUD ---
const createFeeStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, amount } = req.body;
        if (!name || amount === undefined) {
            return res.status(400).json({ error: "Name and amount are required." });
        }
        const newFeeStructure = yield prisma_1.prisma.feeStructure.create({
            data: { name, description, amount: parseFloat(amount) },
        });
        res.status(201).json(newFeeStructure);
    }
    catch (error) {
        console.error("Error creating fee structure:", error);
        res.status(500).json({ error: "Failed to create fee structure." });
    }
});
exports.createFeeStructure = createFeeStructure;
const getAllInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoices = yield prisma_1.prisma.invoice.findMany({});
        res.status(200).json(invoices);
    }
    catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ error: "Failed to retrieve invoices." });
    }
});
exports.getAllInvoices = getAllInvoices;
const getAllFeeStructures = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const feeStructures = yield prisma_1.prisma.feeStructure.findMany();
        res.status(200).json(feeStructures);
    }
    catch (error) {
        console.error("Error fetching fee structures:", error);
        res.status(500).json({ error: "Failed to retrieve fee structures." });
    }
});
exports.getAllFeeStructures = getAllFeeStructures;
const updateFeeStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const feeId = parseInt(req.params.id);
        const { name, description, amount } = req.body;
        const updatedFeeStructure = yield prisma_1.prisma.feeStructure.update({
            where: { id: feeId },
            data: {
                name,
                description,
                amount: amount ? parseFloat(amount) : undefined,
            },
        });
        res.status(200).json(updatedFeeStructure);
    }
    catch (error) {
        res.status(500).json({
            error: `Failed to update fee structure with ID ${req.params.id}.`,
        });
    }
});
exports.updateFeeStructure = updateFeeStructure;
const deleteFeeStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const feeId = parseInt(req.params.id);
        yield prisma_1.prisma.feeStructure.delete({ where: { id: feeId } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({
            error: `Failed to delete fee structure with ID ${req.params.id}.`,
        });
    }
});
exports.deleteFeeStructure = deleteFeeStructure;
// --- Fee Assignment and Payment ---
const assignFeeToStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { feeStructureId, studentIds, dueDate } = req.body;
        if (!feeStructureId ||
            !studentIds ||
            !Array.isArray(studentIds) ||
            !dueDate) {
            return res.status(400).json({
                error: "Fee structure ID, student IDs array, and due date are required.",
            });
        }
        const feeStructure = yield prisma_1.prisma.feeStructure.findUnique({
            where: { id: feeStructureId },
        });
        if (!feeStructure) {
            return res.status(404).json({ error: "Fee Structure not found." });
        }
        // FIX: Increased transaction timeout to handle large batches of students.
        // The default is 5 seconds, which can be too short for many database writes.
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            for (const studentId of studentIds) {
                // Step 1: Create a FeeDetails entry for this specific assignment.
                // This represents the instance of the fee being applied to the student.
                const feeDetail = yield tx.feeDetails.create({
                    data: {
                        studentId: studentId,
                        feeType: feeStructure.name,
                        amount: feeStructure.amount,
                        dueDate: new Date(dueDate),
                    },
                });
                // Step 2: Create an Invoice linked to the new FeeDetails and the FeeStructure template.
                yield tx.invoice.create({
                    data: {
                        studentId: studentId,
                        feeId: feeDetail.id,
                        feeStructureId: feeStructureId,
                        amount: feeStructure.amount,
                        dueDate: new Date(dueDate),
                        issueDate: new Date(),
                        status: enums_1.InvoiceStatus.unpaid,
                    },
                });
            }
        }), {
            timeout: 3000000,
        });
        res
            .status(201)
            .json({ message: "Fee assigned and invoices generated successfully." });
    }
    catch (error) {
        console.error("Error assigning fee structures:", error);
        res
            .status(500)
            .json({ error: "Failed to assign fees and generate invoices." });
    }
});
exports.assignFeeToStudents = assignFeeToStudents;
const markInvoiceAsPaid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { invoiceId } = req.body;
        const { paymentMethod } = req.body;
        if (!paymentMethod) {
            return res.status(400).json({ error: "Payment method is required." });
        }
        const updatedInvoice = yield prisma_1.prisma.invoice.update({
            where: { id: parseInt(invoiceId) },
            data: { status: enums_1.InvoiceStatus.paid },
        });
        yield prisma_1.prisma.payment.create({
            data: {
                invoiceId: updatedInvoice.id,
                amount: updatedInvoice.amount,
                paymentMethod: paymentMethod,
                transactionId: `MANUAL_${updatedInvoice.id}_${Date.now()}`,
                status: "successful",
            },
        });
        res.status(200).json(updatedInvoice);
    }
    catch (error) {
        console.error(`Error marking invoice ${req.params.invoiceId} as paid:`, error);
        res.status(500).json({ error: "Failed to mark invoice as paid." });
    }
});
exports.markInvoiceAsPaid = markInvoiceAsPaid;
