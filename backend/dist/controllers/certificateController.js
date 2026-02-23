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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateController = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const certificateTemplates_1 = require("./certificateTemplates");
const prisma_1 = require("../lib/prisma");
exports.certificateController = {
    // Student: Submit certificate request
    submitRequest: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { studentId, type, reason } = req.body;
            const certificate = yield prisma_1.prisma.certificate.create({
                data: {
                    studentId: parseInt(studentId),
                    type,
                    reason,
                    status: "PENDING",
                },
            });
            res.status(201).json(certificate);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to submit certificate request" });
        }
    }),
    // Student: Get their certificate requests
    getStudentCertificates: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { studentId } = req.params;
            const certificates = yield prisma_1.prisma.certificate.findMany({
                where: { studentId: parseInt(studentId) },
                include: {
                    student: {
                        select: {
                            name: true,
                            admission_number: true,
                            program: true,
                            dateOfBirth: true,
                            department: {
                                select: { name: true },
                            },
                        },
                    },
                },
                orderBy: { requestedAt: "desc" },
            });
            res.json(certificates);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch certificates" });
        }
    }),
    // Admin: Get all certificate requests
    getAllCertificates: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const certificates = yield prisma_1.prisma.certificate.findMany({
                include: {
                    student: {
                        select: {
                            name: true,
                            admission_number: true,
                            program: true,
                            dateOfBirth: true,
                            department: {
                                select: { name: true },
                            },
                        },
                    },
                    approvedBy: {
                        select: { username: true },
                    },
                },
                orderBy: { requestedAt: "desc" },
            });
            res.json(certificates);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch certificates" });
        }
    }),
    // Admin: Approve/Reject certificate request
    updateCertificateStatus: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const { status, rejectionReason, approvedById } = req.body;
            const updateData = { status };
            if (status === "APPROVED") {
                updateData.approvedAt = new Date();
                updateData.approvedById = parseInt(approvedById);
            }
            else if (status === "REJECTED") {
                updateData.rejectedAt = new Date();
                updateData.rejectionReason = rejectionReason;
                updateData.approvedById = parseInt(approvedById);
            }
            const certificate = yield prisma_1.prisma.certificate.update({
                where: { id: parseInt(id) },
                data: updateData,
                include: {
                    student: {
                        select: {
                            name: true,
                            admission_number: true,
                            program: true,
                            dateOfBirth: true,
                            department: {
                                select: { name: true },
                            },
                        },
                    },
                },
            });
            res.json(certificate);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to update certificate status" });
        }
    }),
    // Generate certificate
    generateCertificate: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const { id } = req.params;
            // First get certificate with student data
            const certificate = (yield prisma_1.prisma.certificate.findUnique({
                where: { id: parseInt(id) },
                include: {
                    student: {
                        select: {
                            name: true,
                            admission_number: true,
                            program: true,
                            dateOfBirth: true,
                            department: {
                                select: { name: true },
                            },
                        },
                    },
                },
            }));
            if (!certificate) {
                return res.status(404).json({ error: "Certificate not found" });
            }
            console.log("Certificate found:", certificate);
            console.log("Certificate type:", certificate.type);
            console.log("Student data:", certificate.student);
            // Prepare certificate data for template
            const certificateData = {
                studentName: certificate.student.name,
                admissionNumber: certificate.student.admission_number,
                program: certificate.student.program,
                department: (_a = certificate.student.department) === null || _a === void 0 ? void 0 : _a.name,
                dateOfBirth: certificate.student.date_of_birth
                    ? new Date(certificate.student.date_of_birth).toLocaleDateString()
                    : undefined,
                reason: certificate.reason,
                issuedDate: new Date().toLocaleDateString(),
                academicYear: "2024-25",
            };
            // Get the appropriate template based on certificate type - FIXED
            const template = certificateTemplates_1.certificateTemplates[certificate.type](certificateData);
            // Update certificate status in database
            const updatedCertificate = yield prisma_1.prisma.certificate.update({
                where: { id: parseInt(id) },
                data: {
                    status: "GENERATED",
                    // In generateCertificate method, update this line:
                    certificateUrl: `http://localhost:3000/api/certificates/${id}/download`,
                },
                include: {
                    student: {
                        select: {
                            name: true,
                            admission_number: true,
                            program: true,
                            department: {
                                select: { name: true },
                            },
                        },
                    },
                },
            });
            res.json(updatedCertificate);
        }
        catch (error) {
            console.error("Error generating certificate:", error);
            res.status(500).json({ error: "Failed to generate certificate" });
        }
    }),
    // Download certificate PDF
    downloadCertificate: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const { id } = req.params;
            const certificate = (yield prisma_1.prisma.certificate.findUnique({
                where: { id: parseInt(id) },
                include: {
                    student: {
                        select: {
                            name: true,
                            admission_number: true,
                            program: true,
                            dateOfBirth: true,
                            department: {
                                select: { name: true },
                            },
                        },
                    },
                },
            }));
            if (!certificate) {
                return res.status(404).json({ error: "Certificate not found" });
            }
            if (certificate.status !== "GENERATED") {
                return res.status(400).json({ error: "Certificate not generated yet" });
            }
            // Prepare certificate data
            const certificateData = {
                studentName: certificate.student.name,
                admissionNumber: certificate.student.admission_number,
                program: certificate.student.program,
                department: (_a = certificate.student.department) === null || _a === void 0 ? void 0 : _a.name,
                dateOfBirth: certificate.student.date_of_birth
                    ? new Date(certificate.student.date_of_birth).toLocaleDateString()
                    : undefined,
                reason: certificate.reason,
                issuedDate: new Date().toLocaleDateString(),
                academicYear: "2024-25",
            };
            // Get template
            const templateFunction = certificateTemplates_1.certificateTemplates[certificate.type];
            if (!templateFunction) {
                console.error(`Template not found for type: ${certificate.type}`);
                return res.status(400).json({ error: "Invalid certificate type" });
            }
            const template = templateFunction(certificateData);
            // Create PDF
            const doc = new pdfkit_1.default({
                margin: 0, // Remove default margins, we'll handle them manually
                size: "A4",
                info: {
                    Title: `${certificate.type} Certificate`,
                    Author: "University",
                    Subject: `Certificate for ${certificate.student.name}`,
                },
            });
            // Set response headers
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=certificate-${certificate.id}.pdf`);
            // Pipe PDF to response
            doc.pipe(res);
            // Simplified text rendering with proper positioning
            let yPosition = 100;
            template.content.forEach((item) => {
                // Set font
                doc
                    .fontSize(item.fontSize || 12)
                    .font(item.bold ? "Helvetica-Bold" : "Helvetica");
                // Calculate vertical position with margin
                yPosition += item.margin ? item.margin[0] || 0 : 0; // top margin
                // Handle different alignments
                const options = {};
                if (item.alignment === "center") {
                    options.align = "center";
                    options.width = doc.page.width - 100;
                }
                else if (item.alignment === "right") {
                    options.align = "right";
                    options.width = doc.page.width - 100;
                }
                // Render text
                doc.text(item.text, 50, yPosition, options);
                // Calculate next position based on text height
                const textHeight = doc.heightOfString(item.text, options);
                yPosition += textHeight + (item.margin ? item.margin[2] || 10 : 10); // Add bottom margin
                // Page break if needed
                if (yPosition > doc.page.height - 100) {
                    doc.addPage();
                    yPosition = 100;
                }
            });
            // Finalize PDF
            doc.end();
        }
        catch (error) {
            console.error("Error generating PDF:", error);
            res.status(500).json({ error: "Failed to generate PDF certificate" });
        }
    }),
};
