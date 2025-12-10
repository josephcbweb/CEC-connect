import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { certificateTemplates } from './certificateTemplates';
import { CertificateType } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";



// Proper type definition
type CertificateWithStudent = {
  id: number;
  studentId: number;
  type: CertificateType;
  reason: string;
  status: string;
  requestedAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  approvedById: number | null;
  rejectionReason: string | null;
  certificateUrl: string | null;
  student: {
    name: string;
    admission_number: string;
    program?: string;
    date_of_birth?: Date;
    department?: {
      name: string;
    };
  };
};

export const certificateController = {
  // Student: Submit certificate request
  submitRequest: async (req: Request, res: Response) => {
    try {
      const { studentId, type, reason } = req.body;

      const certificate = await prisma.certificate.create({
        data: {
          studentId: parseInt(studentId),
          type,
          reason,
          status: "PENDING",
        },
      });

      res.status(201).json(certificate);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit certificate request" });
    }
  },

  // Student: Get their certificate requests
  getStudentCertificates: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;

      const certificates = await prisma.certificate.findMany({
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
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  },

  // Admin: Get all certificate requests
  getAllCertificates: async (req: Request, res: Response) => {
    try {
      const certificates = await prisma.certificate.findMany({
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
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  },

  // Admin: Approve/Reject certificate request
  updateCertificateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason, approvedById } = req.body;

      const updateData: any = { status };

      if (status === "APPROVED") {
        updateData.approvedAt = new Date();
        updateData.approvedById = parseInt(approvedById);
      } else if (status === "REJECTED") {
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = rejectionReason;
        updateData.approvedById = parseInt(approvedById);
      }

      const certificate = await prisma.certificate.update({
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
    } catch (error) {
      res.status(500).json({ error: "Failed to update certificate status" });
    }
  },

  // Generate certificate
  generateCertificate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // First get certificate with student data
      const certificate = (await prisma.certificate.findUnique({
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
      })) as CertificateWithStudent;

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
        department: certificate.student.department?.name,
        dateOfBirth: certificate.student.date_of_birth
          ? new Date(certificate.student.date_of_birth).toLocaleDateString()
          : undefined,
        reason: certificate.reason,
        issuedDate: new Date().toLocaleDateString(),
        academicYear: "2024-25",
      };

      // Get the appropriate template based on certificate type - FIXED
      const template =
        certificateTemplates[
          certificate.type as keyof typeof certificateTemplates
        ](certificateData);

      // Update certificate status in database
      const updatedCertificate = await prisma.certificate.update({
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
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ error: "Failed to generate certificate" });
    }
  },

  // Download certificate PDF
  downloadCertificate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const certificate = (await prisma.certificate.findUnique({
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
      })) as CertificateWithStudent;

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
        department: certificate.student.department?.name,
        dateOfBirth: certificate.student.date_of_birth
          ? new Date(certificate.student.date_of_birth).toLocaleDateString()
          : undefined,
        reason: certificate.reason,
        issuedDate: new Date().toLocaleDateString(),
        academicYear: "2024-25",
      };

      // Get template
      const templateFunction =
        certificateTemplates[
          certificate.type as keyof typeof certificateTemplates
        ];
      if (!templateFunction) {
        console.error(`Template not found for type: ${certificate.type}`);
        return res.status(400).json({ error: "Invalid certificate type" });
      }

      const template = templateFunction(certificateData);

      // Create PDF
      const doc = new PDFDocument({
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
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=certificate-${certificate.id}.pdf`
      );

      // Pipe PDF to response
      doc.pipe(res);

      // Simplified text rendering with proper positioning
      let yPosition = 100;

      template.content.forEach((item: any) => {
        // Set font
        doc
          .fontSize(item.fontSize || 12)
          .font(item.bold ? "Helvetica-Bold" : "Helvetica");

        // Calculate vertical position with margin
        yPosition += item.margin ? item.margin[0] || 0 : 0; // top margin

        // Handle different alignments
        const options: any = {};

        if (item.alignment === "center") {
          options.align = "center";
          options.width = doc.page.width - 100;
        } else if (item.alignment === "right") {
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
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF certificate" });
    }
  },
};
