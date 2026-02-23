// backend/src/controllers/certificateController.ts
import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { certificateTemplates } from './certificateTemplates';
import { prisma } from "../lib/prisma";
import { verifyToken } from "../utils/jwt";

// Helper to get user from token
const getUserFromToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  const token = authHeader.split(' ')[1];
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
};

export const certificateController = {
  // Student: Submit certificate request
// backend/src/controllers/certificateController.ts - Updated submitRequest

// backend/src/controllers/certificateController.ts - Fixed submitRequest function

// backend/src/controllers/certificateController.ts - Fixed submitRequest function

// backend/src/controllers/certificateController.ts - Fixed submitRequest with better error handling

submitRequest: async (req: Request, res: Response) => {
  try {
    const { studentId, type, reason } = req.body;
    
    // Verify authentication
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("Received certificate request:", { studentId, type, reason });

    // Validate required fields
    if (!studentId || !type || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // STEP 1: Get student details with class and advisor information
    console.log("Fetching student with ID:", studentId);
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: {
        class: {
          include: {
            advisor: true,
            batchDepartment: {
              include: {
                department: true,
                batch: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      console.error(`Student not found with ID: ${studentId}`);
      return res.status(404).json({ 
        error: "Student not found. Please check your student ID." 
      });
    }
    console.log("Found student:", { id: student.id, name: student.name, classId: student.classId });

    // STEP 2: Check if student has a class assigned
    if (!student.class) {
      console.error(`Student ${studentId} (${student.name}) has no class assigned`);
      return res.status(400).json({ 
        error: "You are not assigned to any class. Please contact the administration to set up your class assignment." 
      });
    }
    console.log("Student class:", { classId: student.class.id, className: student.class.name });

    // STEP 3: Check if the class has an advisor
    if (!student.class.advisorId) {
      console.error(`Class ${student.class.name} has no advisor assigned`);
      return res.status(400).json({ 
        error: "Your class does not have an advisor assigned. Please contact the administration to assign a class advisor." 
      });
    }
    console.log("Class advisor ID:", student.class.advisorId);

    // STEP 4: Check if the advisor user actually exists
    const advisor = await prisma.user.findUnique({
      where: { id: student.class.advisorId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!advisor) {
      console.error(`Advisor user not found with ID: ${student.class.advisorId} for class ${student.class.name}`);
      return res.status(400).json({ 
        error: "Your class advisor account is not properly configured. Please contact the administration." 
      });
    }
    console.log("Found advisor:", { id: advisor.id, username: advisor.username });

    // STEP 5: Verify advisor has the correct role
    const hasAdvisorRole = advisor.userRoles?.some(ur => 
      ur.role.name === 'advisor' || ur.role.name.includes('advisor')
    );

    if (!hasAdvisorRole) {
      console.error(`User ${advisor.username} (ID: ${advisor.id}) is assigned as advisor but doesn't have advisor role`);
      console.error("User roles:", advisor.userRoles?.map(ur => ur.role.name));
      return res.status(400).json({ 
        error: "Your class advisor is not properly configured with the correct permissions. Please contact the administration." 
      });
    }

    console.log(`All validations passed. Creating certificate for student ${student.name} with advisor ${advisor.username}`);

    // STEP 6: Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        studentId: parseInt(studentId),
        type,
        reason,
        status: "PENDING",
        workflowStatus: "SUBMITTED",
        advisorId: student.class.advisorId  // Using advisorId from class
      },
    });

    console.log("Certificate created successfully with ID:", certificate.id);

    // STEP 7: Create initial approval record
    await prisma.certificateApproval.create({
      data: {
        certificateId: certificate.id,
        approverId: parseInt(studentId),
        role: "STUDENT",
        action: "SUBMIT",
        remarks: "Certificate request submitted"
      }
    });

    console.log("Approval record created successfully");
    res.status(201).json({
      success: true,
      message: "Certificate request submitted successfully",
      certificate
    });

  } catch (error: unknown) {
    console.error("SUBMIT ERROR DETAILS:", error);
    
    if (error && typeof error === 'object') {
      // Handle Prisma-specific errors
      if ('code' in error) {
        const prismaError = error as { code: string; message: string; meta?: any };
        console.error("Prisma Error Code:", prismaError.code);
        console.error("Prisma Error Message:", prismaError.message);
        console.error("Prisma Error Meta:", prismaError.meta);
        
        if (prismaError.code === 'P2002') {
          return res.status(400).json({ 
            error: "A duplicate request was detected. Please try again." 
          });
        }
        
        if (prismaError.code === 'P2003') {
          return res.status(400).json({ 
            error: "Foreign key constraint failed. Please check your data and try again." 
          });
        }
      }
      
      // Handle standard Error objects
      if (error instanceof Error) {
        return res.status(500).json({ 
          error: "Failed to submit certificate request. " + error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
    
    // Fallback for unknown error types
    res.status(500).json({ 
      error: "An unexpected error occurred. Please try again later." 
    });
  }
},

  // Student: Get their certificate requests
  getStudentCertificates: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      
      // Verify authentication
      const user = getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const certificates = await prisma.certificate.findMany({
        where: { studentId: parseInt(studentId) },
        include: {
          student: {
            select: {
              name: true,
              admission_number: true,
              program: true,
            },
          },
          approvals: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { requestedAt: "desc" },
      });

      res.json(certificates);
    } catch (error) {
      console.error("Fetch error:", error);
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  },

  // Get certificates for a specific role (Advisor, HOD, Office, Principal)
  getCertificatesByRole: async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.params;
      const { status, search, page = 1, limit = 10 } = req.query;

      // Verify authentication
      const user = getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Build where clause based on role
      let whereClause: any = {};

      switch(role) {
        case 'advisor':
          // Advisor sees certificates of their advisees
          const advisedStudents = await prisma.student.findMany({
            where: { advisorId: parseInt(userId) },
            select: { id: true }
          });
          whereClause.studentId = { in: advisedStudents.map(s => s.id) };
          whereClause.workflowStatus = { in: ['SUBMITTED', 'WITH_ADVISOR'] };
          break;
          
        case 'hod':
          // HOD sees certificates from their department
          const hodDept = await prisma.hodDetails.findUnique({
            where: { userId: parseInt(userId) },
            include: { department: true }
          });
          
          if (hodDept) {
            const deptStudents = await prisma.student.findMany({
              where: { departmentId: hodDept.departmentId },
              select: { id: true }
            });
            whereClause.studentId = { in: deptStudents.map(s => s.id) };
            whereClause.workflowStatus = 'WITH_HOD';
          }
          break;
          
        case 'office':
          whereClause.workflowStatus = 'WITH_OFFICE';
          break;
          
        case 'principal':
          whereClause.workflowStatus = 'WITH_PRINCIPAL';
          break;
        
        default:
          return res.status(400).json({ error: "Invalid role" });
      }

      // Status filter
      if (status && status !== 'all' && status !== 'undefined') {
        whereClause.workflowStatus = status;
      }

      // Search filter
      if (search) {
        whereClause.student = {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { admission_number: { contains: search as string, mode: 'insensitive' } }
          ]
        };
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [total, certificates] = await Promise.all([
        prisma.certificate.count({ where: whereClause }),
        prisma.certificate.findMany({
          where: whereClause,
          include: {
            student: {
              select: {
                name: true,
                admission_number: true,
                program: true,
                class: { select: { name: true } },
                department: { select: { name: true } }
              }
            },
            approvals: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          },
          orderBy: { requestedAt: 'desc' },
          skip,
          take
        })
      ]);

      res.json({
        data: certificates,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error("Role fetch error:", error);
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  },

  // Process approval/rejection at each level
  processCertificate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { action, remarks, userId, role } = req.body;

      // Verify authentication
      const user = getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const certificate = await prisma.certificate.findUnique({
        where: { id: parseInt(id) }
      });

      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      const updateData: any = {};
      const nextWorkflowMap: Record<string, string> = {
        'SUBMITTED': 'WITH_ADVISOR',
        'WITH_ADVISOR': 'WITH_HOD',
        'WITH_HOD': 'WITH_OFFICE',
        'WITH_OFFICE': 'WITH_PRINCIPAL',
        'WITH_PRINCIPAL': 'COMPLETED'
      };

      // Handle different actions
      if (action === 'REJECT') {
        updateData.workflowStatus = 'REJECTED';
        updateData.status = 'REJECTED';
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = remarks;
      } else if (action === 'FORWARD') {
        // Move to next stage
        updateData.workflowStatus = nextWorkflowMap[certificate.workflowStatus] || 'COMPLETED';
        
        // Set role-specific fields and timestamps
        const now = new Date();
        
        if (role === 'advisor') {
          updateData.advisorId = parseInt(userId);
          updateData.advisorActionAt = now;
          updateData.advisorRemarks = remarks;
        } else if (role === 'hod') {
          updateData.hodId = parseInt(userId);
          updateData.hodActionAt = now;
          updateData.hodRemarks = remarks;
        } else if (role === 'office') {
          updateData.officeId = parseInt(userId);
          updateData.officeActionAt = now;
          updateData.officeRemarks = remarks;
        } else if (role === 'principal') {
          updateData.principalId = parseInt(userId);
          updateData.principalActionAt = now;
          updateData.principalRemarks = remarks;
          
          // If principal approves, mark as approved (ready for generation)
          updateData.status = 'APPROVED';
          updateData.approvedAt = now;
        }
      }

      // Update certificate
      const updatedCertificate = await prisma.certificate.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      // Create approval record
      await prisma.certificateApproval.create({
        data: {
          certificateId: parseInt(id),
          approverId: parseInt(userId),
          role: role.toUpperCase(),
          action,
          remarks: remarks || ''
        }
      });

      res.json(updatedCertificate);

    } catch (error) {
      console.error("Process error:", error);
      res.status(500).json({ error: "Failed to process certificate" });
    }
  },

  // Admin/Office: Generate certificate
  generateCertificate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verify authentication
      const user = getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const certificate = await prisma.certificate.findUnique({
        where: { id: parseInt(id) },
        include: {
          student: {
            select: {
              name: true,
              admission_number: true,
              program: true,
              dateOfBirth: true,
              department: {
                select: { name: true }
              }
            }
          }
        }
      });

      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      if (certificate.status !== 'APPROVED') {
        return res.status(400).json({ error: "Certificate not approved yet" });
      }

      // Update certificate status
      const updatedCertificate = await prisma.certificate.update({
        where: { id: parseInt(id) },
        data: {
          status: "GENERATED",
          workflowStatus: "COMPLETED",
          certificateUrl: `http://localhost:3000/api/certificates/${id}/download`,
        }
      });

      res.json(updatedCertificate);

    } catch (error) {
      console.error("Generate error:", error);
      res.status(500).json({ error: "Failed to generate certificate" });
    }
  },

  // Download certificate PDF
  downloadCertificate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const certificate = await prisma.certificate.findUnique({
        where: { id: parseInt(id) },
        include: {
          student: {
            select: {
              name: true,
              admission_number: true,
              program: true,
              dateOfBirth: true,
              department: {
                select: { name: true }
              },
            },
          },
        },
      });

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
        program: certificate.student.program || '',
        department: certificate.student.department?.name || '',
        dateOfBirth: certificate.student.dateOfBirth
          ? new Date(certificate.student.dateOfBirth).toLocaleDateString()
          : undefined,
        reason: certificate.reason,
        issuedDate: new Date().toLocaleDateString(),
        academicYear: "2024-25",
      };

      // Get template
      const templateFunction = certificateTemplates[certificate.type as keyof typeof certificateTemplates];
      if (!templateFunction) {
        return res.status(400).json({ error: "Invalid certificate type" });
      }

      const template = templateFunction(certificateData);

      // Create PDF
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        info: {
          Title: `${certificate.type} Certificate`,
          Author: "College",
          Subject: `Certificate for ${certificate.student.name}`,
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=certificate-${certificate.id}.pdf`
      );

      doc.pipe(res);

      // Render PDF content
      let yPosition = 100;

      template.content.forEach((item: any) => {
        doc.fontSize(item.fontSize || 12)
           .font(item.bold ? "Helvetica-Bold" : "Helvetica");

        yPosition += item.margin?.[0] || 0;

        const options: any = {};
        if (item.alignment === "center") {
          options.align = "center";
          options.width = doc.page.width - 100;
        } else if (item.alignment === "right") {
          options.align = "right";
          options.width = doc.page.width - 100;
        }

        doc.text(item.text, 50, yPosition, options);
        yPosition += doc.heightOfString(item.text, options) + (item.margin?.[2] || 10);
      });

      doc.end();

    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to download certificate" });
    }
  },

  // Get workflow status for a certificate
  getWorkflowStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verify authentication
      const user = getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const certificate = await prisma.certificate.findUnique({
        where: { id: parseInt(id) },
        include: {
          student: {
            select: {
              name: true,
              admission_number: true,
              class: { select: { name: true } },
              department: { select: { name: true } }
            }
          },
          approvals: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      res.json(certificate);

    } catch (error) {
      console.error("Status error:", error);
      res.status(500).json({ error: "Failed to fetch workflow status" });
    }
  }
};