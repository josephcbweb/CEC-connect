// backend/src/controllers/certificateController.ts
import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { certificateTemplates } from './certificateTemplates';
import { prisma } from "../lib/prisma";
import { verifyToken } from "../utils/jwt";

// ============ NEW: Notification Helper Function ============
const createCertificateNotification = async (
  studentId: number,
  certificateId: number,
  certificateType: string
) => {
  try {
    // Get student details to verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) return;

    // Find a user to be the sender (preferably office staff or any user)
    let senderId = null;
    
    // Try to find office staff first
    const officeUser = await prisma.user.findFirst({
      where: {
        userRoles: {
          some: {
            role: {
              name: { in: ['office', 'office_staff', 'OFFICE'] }
            }
          }
        }
      }
    });
    
    if (officeUser) {
      senderId = officeUser.id;
    } else {
      // Fallback to any user
      const anyUser = await prisma.user.findFirst();
      senderId = anyUser?.id || 1; // Default to ID 1 if no users found
    }

    // Format certificate type for display
    const formattedType = certificateType.replace(/_/g, ' ').toLowerCase()
      .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // Create notification
    await prisma.notification.create({
      data: {
        title: "Certificate Generated",
        description: `Your ${formattedType} certificate has been generated and is ready for download.`,
        targetType: "STUDENT",
        targetValue: studentId.toString(),
        priority: "IMPORTANT",
        status: "published",
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        senderId: senderId,
      },
    });

    console.log(`✅ Certificate notification created for student ID: ${studentId}`);
  } catch (error) {
    console.error("❌ Error creating certificate notification:", error);
    // Don't throw - we don't want to fail certificate generation if notification fails
  }
};
// ============ END NEW FUNCTION ============

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

// Helper to check if next approver exists
const checkNextApproverExists = async (currentRole: string, certificate: any) => {
  const departmentId = certificate.student?.departmentId;
  
  switch (currentRole) {
    case 'advisor':
      // Check if HOD exists for this department
      if (!departmentId) {
        return {
          exists: false,
          message: "❌ Cannot forward: Student is not assigned to any department. Please contact administration."
        };
      }
      
      // Check multiple ways HOD could be assigned
      const hodViaDetails = await prisma.hodDetails.findFirst({
        where: { departmentId }
      });
      
      const hodViaDepartment = await prisma.department.findFirst({
        where: { 
          id: departmentId,
          hodId: { not: null }
        }
      });
      
      const hodExists = hodViaDetails || hodViaDepartment;
      
      if (!hodExists) {
        return {
          exists: false,
          message: "❌ Cannot forward: No HOD (Head of Department) assigned to this department. Please contact administration to assign a HOD."
        };
      }
      break;
      
    case 'hod':
      // Check if Office staff exists
      const officeExists = await prisma.user.findFirst({
        where: {
          userRoles: {
            some: {
              role: {
                name: { in: ['office', 'office_staff', 'OFFICE'] }
              }
            }
          }
        }
      });
      
      if (!officeExists) {
        return {
          exists: false,
          message: "❌ Cannot forward: No Office Staff assigned in the system. Please contact administration to assign office staff."
        };
      }
      break;
      
    case 'office':
      // Check if Principal exists
      const principalExists = await prisma.user.findFirst({
        where: {
          userRoles: {
            some: {
              role: {
                name: { in: ['principal', 'PRINCIPAL', 'Principal'] }
              }
            }
          }
        }
      });
      
      if (!principalExists) {
        return {
          exists: false,
          message: "❌ Cannot forward: No Principal assigned in the system. Please contact administration to assign a Principal."
        };
      }
      break;
      
    case 'principal':
      // Principal is final approver, no next approver needed
      return { exists: true };
      
    default:
      return { exists: true };
  }
  
  return { exists: true };
};

export const certificateController = {
  // Student: Submit certificate request
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

      // Get student details with class and advisor information
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
          },
          department: true
        }
      });

      if (!student) {
        return res.status(404).json({ 
          error: "Student not found. Please check your student ID." 
        });
      }

      if (!student.class) {
        return res.status(400).json({ 
          error: "❌ Cannot submit: You are not assigned to any class. Please contact the administration." 
        });
      }

      if (!student.class.advisorId) {
        return res.status(400).json({ 
          error: "❌ Cannot submit: Your class does not have an advisor assigned. Please contact the administration." 
        });
      }

      // Check if HOD exists for student's department before creating request
      const departmentId = student.departmentId;
      let hodWarning = null;
      
      if (departmentId) {
        const hodExists = await prisma.hodDetails.findFirst({
          where: { departmentId }
        }) || await prisma.department.findFirst({
          where: { 
            id: departmentId,
            hodId: { not: null }
          }
        });
        
        if (!hodExists) {
          hodWarning = "⚠️ Warning: Your department does not have a HOD (Head of Department) assigned. Your request can be submitted but will be delayed until a HOD is assigned. Please contact administration.";
        }
      }

      // Check if Office staff exists
      const officeExists = await prisma.user.findFirst({
        where: {
          userRoles: {
            some: {
              role: {
                name: { in: ['office', 'office_staff', 'OFFICE'] }
              }
            }
          }
        }
      });

      if (!officeExists) {
        hodWarning = hodWarning 
          ? hodWarning + " Also, no office staff is assigned in the system."
          : "⚠️ Warning: No office staff is assigned in the system. Your request will be delayed. Please contact administration.";
      }

      // Check if Principal exists
      const principalExists = await prisma.user.findFirst({
        where: {
          userRoles: {
            some: {
              role: {
                name: { in: ['principal', 'PRINCIPAL', 'Principal'] }
              }
            }
          }
        }
      });

      if (!principalExists) {
        hodWarning = hodWarning 
          ? hodWarning + " Also, no principal is assigned in the system."
          : "⚠️ Warning: No principal is assigned in the system. Your request will be delayed. Please contact administration.";
      }

      // Create certificate WITH_ADVISOR status directly
      const certificate = await prisma.certificate.create({
        data: {
          studentId: parseInt(studentId),
          type,
          reason,
          status: "PENDING",
          workflowStatus: "WITH_ADVISOR",
          advisorId: student.class.advisorId
        },
      });

      // Create initial approval record
      await prisma.certificateApproval.create({
        data: {
          certificateId: certificate.id,
          approverId: parseInt(studentId),
          role: "STUDENT",
          action: "SUBMIT",
          remarks: "Certificate request submitted"
        }
      });

      // Return with warning if any approvers are missing
      const responseData: any = {
        success: true,
        message: "Certificate request submitted successfully",
        certificate
      };

      if (hodWarning) {
        responseData.warning = hodWarning;
      }

      res.status(201).json(responseData);

    } catch (error: unknown) {
      console.error("SUBMIT ERROR DETAILS:", error);
      res.status(500).json({ 
        error: "An unexpected error occurred. Please try again later." 
      });
    }
  },

  // Student: Get their certificate requests
  getStudentCertificates: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      
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
              currentSemester: true,
              department: {
                select: { name: true, id: true }
              }
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

  // Get certificates for a specific role with filters
  getCertificatesByRole: async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.params;
      const { 
        status, 
        search, 
        page = 1, 
        limit = 10,
        departmentId,
        semester
      } = req.query;

      console.log(`Getting certificates for role: ${role}, userId: ${userId}`);
      console.log('Filters:', { departmentId, semester, status, search });

      const user = getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      let whereClause: any = {};
      const parsedUserId = parseInt(userId);

      switch(role) {
        case 'advisor':
          // Advisor validation and logic
          const advisedClass = await prisma.class.findFirst({
            where: { advisorId: parsedUserId },
            include: { 
              students: { 
                select: { id: true } 
              } 
            }
          });

          if (!advisedClass) {
            return res.status(403).json({ error: "User is not a class advisor" });
          }

          const advisorStudentIds = advisedClass.students.map(s => s.id);
          whereClause.studentId = { in: advisorStudentIds };
          
          if (semester && semester !== 'all') {
            whereClause.student = {
              currentSemester: parseInt(semester as string)
            };
          }
          
          if (!status || status === 'all') {
            whereClause.workflowStatus = 'WITH_ADVISOR';
          } else {
            whereClause.workflowStatus = status;
          }
          break;
          
        case 'hod':
          console.log(`Processing HOD request for userId: ${parsedUserId}`);
          
          // Find the HOD role in roles table
          const hodRole = await prisma.role.findFirst({
            where: {
              OR: [
                { name: 'hod' },
                { name: 'HOD' },
                { name: 'head_of_department' },
                { name: { contains: 'hod', mode: 'insensitive' } }
              ]
            }
          });

          if (!hodRole) {
            console.log('HOD role not found in roles table');
            return res.status(404).json({ error: "HOD role not configured in the system. Please contact administration." });
          }

          // Check if this user has the HOD role
          const userHasHODRole = await prisma.userRole.findFirst({
            where: {
              userId: parsedUserId,
              roleId: hodRole.id
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            }
          });

          if (!userHasHODRole) {
            console.log(`User ${parsedUserId} is not a HOD`);
            return res.status(403).json({ 
              error: "Access denied. You do not have HOD role.",
              requiredRole: "hod"
            });
          }

          // Find which department this HOD manages
          const hodDetails = await prisma.hodDetails.findUnique({
            where: { userId: parsedUserId },
            include: { department: true }
          });

          const departmentAsHod = await prisma.department.findFirst({
            where: { hodId: parsedUserId }
          });

          let hodDepartmentId = hodDetails?.departmentId || departmentAsHod?.id;

          if (!hodDepartmentId) {
            console.log('Could not find department for HOD');
            return res.status(400).json({ error: "You are not assigned to any department as HOD. Please contact administration." });
          }

          // Get students from that department with optional filters
          let studentWhere: any = { 
            departmentId: hodDepartmentId,
            status: { not: 'deleted' }
          };
          
          if (semester && semester !== 'all') {
            studentWhere.currentSemester = parseInt(semester as string);
          }
          
          if (departmentId && departmentId !== 'all') {
            studentWhere.departmentId = parseInt(departmentId as string);
          }

          const deptStudents = await prisma.student.findMany({
            where: studentWhere,
            select: { id: true }
          });

          whereClause.studentId = { 
            in: deptStudents.map(s => s.id) 
          };

          if (status && status !== 'all' && status !== 'undefined') {
            whereClause.workflowStatus = status;
          } else {
            whereClause.workflowStatus = {
              in: ['WITH_HOD', 'WITH_OFFICE', 'WITH_PRINCIPAL', 'COMPLETED']
            };
          }
          break;
          
        case 'office':
          console.log(`Processing office request for userId: ${parsedUserId}`);
          
          // Verify this user is actually office staff
          const officeUser = await prisma.user.findUnique({
            where: { id: parsedUserId },
            include: {
              userRoles: {
                include: {
                  role: true
                }
              }
            }
          });

          if (!officeUser) {
            return res.status(404).json({ error: "User not found" });
          }

          // Check for office role in user_roles
          const hasOfficeRole = officeUser.userRoles.some(ur => 
            ur.role.name.toLowerCase() === 'office' || 
            ur.role.name.toLowerCase().includes('office') ||
            ur.role.name.toLowerCase() === 'office_staff'
          );

          if (!hasOfficeRole) {
            console.log('User is not office staff');
            return res.status(403).json({ error: "Access denied. You are not authorized as office staff." });
          }

          // Office staff can see ALL certificates, but with filters
          whereClause = {};

          if (departmentId && departmentId !== 'all') {
            whereClause.student = {
              departmentId: parseInt(departmentId as string)
            };
          }

          if (semester && semester !== 'all') {
            if (!whereClause.student) whereClause.student = {};
            whereClause.student.currentSemester = parseInt(semester as string);
          }

          if (status && status !== 'all' && status !== 'undefined') {
            whereClause.workflowStatus = status;
          } else {
            whereClause.workflowStatus = {
              in: ['WITH_OFFICE', 'WITH_PRINCIPAL', 'COMPLETED']
            };
          }

          console.log('Office user - showing filtered certificates');
          break;
          
        case 'principal':
          console.log(`Processing principal request for userId: ${parsedUserId}`);
          
          // Find the principal role ID first
          const principalRole = await prisma.role.findFirst({
            where: {
              name: {
                in: ['principal', 'PRINCIPAL', 'Principal']
              }
            }
          });

          if (!principalRole) {
            console.log('Principal role not found in roles table');
            return res.status(404).json({ error: "Principal role not configured in the system. Please contact administration." });
          }

          // Now find the user who has this principal role
          const principalUserRole = await prisma.userRole.findFirst({
            where: {
              roleId: principalRole.id,
              userId: parsedUserId
            },
            include: {
              user: true,
              role: true
            }
          });

          if (!principalUserRole) {
            console.log(`User ${parsedUserId} does not have principal role`);
            return res.status(403).json({ error: "Access denied. You are not authorized as principal." });
          }

          // PRINCIPAL SEES ALL CERTIFICATES with filters
          whereClause = {};

          if (departmentId && departmentId !== 'all') {
            whereClause.student = {
              departmentId: parseInt(departmentId as string)
            };
          }

          if (semester && semester !== 'all') {
            if (!whereClause.student) whereClause.student = {};
            whereClause.student.currentSemester = parseInt(semester as string);
          }

          if (status && status !== 'all' && status !== 'undefined') {
            whereClause.workflowStatus = status;
          } else {
            whereClause.workflowStatus = {
              in: ['WITH_PRINCIPAL', 'COMPLETED']
            };
          }
          break;
          
        case 'admin':
          console.log(`Processing admin request for userId: ${parsedUserId}`);
          
          // Verify this user is actually an admin
          const adminUser = await prisma.user.findUnique({
            where: { id: parsedUserId },
            include: {
              userRoles: {
                include: {
                  role: true
                }
              }
            }
          });

          if (!adminUser) {
            return res.status(404).json({ error: "User not found" });
          }

          // Check for admin role
          const hasAdminRole = adminUser.userRoles.some(ur => 
            ur.role.name.toLowerCase() === 'admin'
          );

          if (!hasAdminRole) {
            console.log('User is not admin');
            return res.status(403).json({ error: "Access denied. You are not authorized as admin." });
          }

          // Admin can see ALL certificates with filters
          whereClause = {};

          // Apply filters
          if (departmentId && departmentId !== 'all') {
            whereClause.student = {
              departmentId: parseInt(departmentId as string)
            };
          }

          if (semester && semester !== 'all') {
            if (!whereClause.student) whereClause.student = {};
            whereClause.student.currentSemester = parseInt(semester as string);
          }

          if (status && status !== 'all' && status !== 'undefined') {
            whereClause.workflowStatus = status;
          }
          // No default filter - admins see everything

          console.log('Admin user - showing all certificates');
          break;
          
        default:
          return res.status(400).json({ error: "Invalid role" });
      }

      // Search filter (applies to all roles)
      if (search) {
        const searchValue = search as string;
        if (whereClause.student) {
          whereClause.student = {
            ...whereClause.student,
            OR: [
              { name: { contains: searchValue, mode: 'insensitive' } },
              { admission_number: { contains: searchValue, mode: 'insensitive' } }
            ]
          };
        } else {
          whereClause.student = {
            OR: [
              { name: { contains: searchValue, mode: 'insensitive' } },
              { admission_number: { contains: searchValue, mode: 'insensitive' } }
            ]
          };
        }
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      console.log('Final where clause:', JSON.stringify(whereClause, null, 2));

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
                currentSemester: true,
                class: { select: { name: true } },
                department: { select: { name: true, id: true } }
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

      const user = getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const certificate = await prisma.certificate.findUnique({
        where: { id: parseInt(id) },
        include: {
          student: {
            include: {
              department: true,
              class: {
                include: {
                  batchDepartment: {
                    include: {
                      department: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      // If action is FORWARD, check if next approver exists
      if (action === 'FORWARD') {
        const nextApproverCheck = await checkNextApproverExists(role, certificate);
        
        if (!nextApproverCheck.exists) {
          return res.status(400).json({ 
            error: nextApproverCheck.message,
            code: 'NEXT_APPROVER_MISSING'
          });
        }
      }

      const updateData: any = {};
      const now = new Date();

      // Define workflow order
      const workflowOrder = [
        'WITH_ADVISOR',
        'WITH_HOD', 
        'WITH_OFFICE', 
        'WITH_PRINCIPAL', 
        'COMPLETED'
      ];

      if (action === 'REJECT') {
        updateData.workflowStatus = 'REJECTED';
        updateData.status = 'REJECTED';
        updateData.rejectedAt = now;
        updateData.rejectionReason = remarks;
      } else if (action === 'FORWARD') {
        const currentIndex = workflowOrder.indexOf(certificate.workflowStatus);
        const nextStatus = currentIndex < workflowOrder.length - 1 
          ? workflowOrder[currentIndex + 1] 
          : 'COMPLETED';
        
        updateData.workflowStatus = nextStatus;
        
        // Set role-specific fields
        if (role === 'advisor') {
          updateData.advisorId = parseInt(userId);
          updateData.advisorActionAt = now;
          updateData.advisorRemarks = remarks;
          
          if (nextStatus === 'WITH_HOD') {
            const departmentId = certificate.student.departmentId;
            
            if (departmentId) {
              const hodDetails = await prisma.hodDetails.findFirst({
                where: { departmentId }
              });
              
              if (hodDetails) {
                updateData.hodId = hodDetails.userId;
                console.log(`Assigned HOD ID ${hodDetails.userId} for certificate ${id}`);
              }
            }
          }
        } else if (role === 'hod') {
          updateData.hodId = parseInt(userId);
          updateData.hodActionAt = now;
          updateData.hodRemarks = remarks;
          
          if (nextStatus === 'WITH_OFFICE') {
            const officeUser = await prisma.user.findFirst({
              where: {
                userRoles: {
                  some: {
                    role: {
                      name: { in: ['office', 'office_staff'] }
                    }
                  }
                }
              }
            });
            
            if (officeUser) {
              updateData.officeId = officeUser.id;
            }
          }
        } else if (role === 'office') {
          updateData.officeId = parseInt(userId);
          updateData.officeActionAt = now;
          updateData.officeRemarks = remarks;
          
          if (nextStatus === 'WITH_PRINCIPAL') {
            const principalUser = await prisma.user.findFirst({
              where: {
                userRoles: {
                  some: {
                    role: {
                      name: 'principal'
                    }
                  }
                }
              }
            });
            
            if (principalUser) {
              updateData.principalId = principalUser.id;
            }
          }
        } else if (role === 'principal') {
          updateData.principalId = parseInt(userId);
          updateData.principalActionAt = now;
          updateData.principalRemarks = remarks;
          
          updateData.status = 'APPROVED';
          updateData.approvedAt = now;
        }
      }

      const updatedCertificate = await prisma.certificate.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      await prisma.certificateApproval.create({
        data: {
          certificateId: parseInt(id),
          approverId: parseInt(userId),
          role: role.toUpperCase(),
          action,
          remarks: remarks || ''
        }
      });

      console.log('Certificate updated successfully:', {
        id: updatedCertificate.id,
        workflowStatus: updatedCertificate.workflowStatus,
        hodId: updatedCertificate.hodId
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

      const user = getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const certificate = await prisma.certificate.findUnique({
        where: { id: parseInt(id) },
        include: {
          student: {
            select: {
              id: true,  // Make sure to include student ID for notification
              name: true,
              admission_number: true,
              program: true,
              dateOfBirth: true,
              currentSemester: true,
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

      const updatedCertificate = await prisma.certificate.update({
        where: { id: parseInt(id) },
        data: {
          status: "GENERATED",
          workflowStatus: "COMPLETED",
          certificateUrl: `http://localhost:3000/api/certificates/${id}/download`,
        }
      });

      // ============ NEW: Create notification for student ============
      await createCertificateNotification(
        certificate.student.id,
        certificate.id,
        certificate.type
      );
      // ============ END NEW NOTIFICATION ============

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
              currentSemester: true,
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
        semester: certificate.student.currentSemester || 1,
      };

      const templateFunction = certificateTemplates[certificate.type as keyof typeof certificateTemplates];
      if (!templateFunction) {
        return res.status(400).json({ error: "Invalid certificate type" });
      }

      const template = templateFunction(certificateData);

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
              currentSemester: true,
              class: { select: { name: true } },
              department: { select: { name: true, id: true } }
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