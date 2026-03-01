import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../utils/jwt";
import type { AuthenticatedRequest } from "../utils/types";
import { logAudit } from "../utils/auditLogger";
import {
  ApprovalStatus,
  CourseType,
  NoDueStatus,
  RequestStatus,
  RequestWorkflowStatus,
  StudentStatus,
} from "../generated/prisma/enums";

// 3.1 POST /api/nodue/register
export const registerSemester = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    let { studentId, courseIds, targetSemester, hostelService } = req.body;
    studentId = Number(studentId);

    if (!courseIds || !Array.isArray(courseIds)) {
      res.status(400).json({ message: "Invalid course selection" });
      return;
    }

    // Pre-fetch data to reduce transaction time
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    if (student.status === "graduated") {
      res
        .status(400)
        .json({ message: "Cannot generate dues for graduated students" });
      return;
    }

    // Use student's current semester if not provided
    if (!targetSemester) {
      targetSemester = student.currentSemester;
    }

    const serviceDepts = await prisma.serviceDepartment.findMany({
      where: { name: { in: ["Library", "Accounts", "Hostel"] } },
    });

    const libraryDept = serviceDepts.find((d) => d.name === "Library");
    const accountsDept = serviceDepts.find((d) => d.name === "Accounts");
    const hostelDept = serviceDepts.find((d) => d.name === "Hostel");

    // Fetch courses to validate and get details
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: { department: true },
    });

    if (courses.length !== courseIds.length) {
      res
        .status(400)
        .json({ message: "One or more selected courses not found" });
      return;
    }

    // Start transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Check for existing pending request
        const existingRequest = await tx.noDueRequest.findFirst({
          where: {
            studentId,
            targetSemester: targetSemester || 1,
            isArchived: false,
            status: { not: "rejected" },
          },
        });

        let requestId: number;

        if (existingRequest) {
          requestId = existingRequest.id;
          // If request exists, we just add to it.
        } else {
          // Archive any other pending requests for other semesters if needed (optional logic)
          // For now, let's just create the new one.
          const newRequest = await tx.noDueRequest.create({
            data: {
              studentId,
              targetSemester: targetSemester || 1,
              reason: "Semester Registration",
              status: RequestStatus.pending,
              workflowStatus: RequestWorkflowStatus.submitted,
            },
          });
          requestId = newRequest.id;
        }

        // 3. Link selected courses (avoid duplicates)
        for (const courseId of courseIds) {
          const exists = await tx.courseSelection.findFirst({
            where: { requestId, courseId },
          });
          if (!exists) {
            await tx.courseSelection.create({
              data: { requestId, courseId },
            });
          }
        }

        // 4. Auto-Generate Dues
        const duesToCreate = [];

        // Only generate common dues if it's a NEW request
        if (!existingRequest) {
          // Fetch configured dues for this semester + student's program
          const dueConfigs = await tx.dueConfiguration.findMany({
            where: {
              semester: targetSemester,
              program: student.program,
              isActive: true,
            },
          });

          for (const config of dueConfigs) {
            if (config.serviceDepartmentId) {
              const serviceDept = await tx.serviceDepartment.findUnique({
                where: { id: config.serviceDepartmentId },
              });

              if (serviceDept?.name === "Hostel" && !student.hostel_service) {
                continue;
              }

              duesToCreate.push({
                requestId,
                serviceDepartmentId: config.serviceDepartmentId,
                status: NoDueStatus.pending,
              });
            }
          }

          // Fallback for legacy/hardcoded if no configs exist?
          if (dueConfigs.length === 0) {
            if (libraryDept) {
              duesToCreate.push({
                requestId,
                serviceDepartmentId: libraryDept.id,
                status: NoDueStatus.pending,
              });
            }
            if (accountsDept) {
              duesToCreate.push({
                requestId,
                serviceDepartmentId: accountsDept.id,
                status: NoDueStatus.pending,
              });
            }
            if (student.hostel_service && hostelDept) {
              duesToCreate.push({
                requestId,
                serviceDepartmentId: hostelDept.id,
                status: NoDueStatus.pending,
              });
            }
          }
        }

        // Academic Departments (Labs, Electives, Theory)
        // Create a separate NoDue entry for EACH selected course to allow granular clearance
        for (const course of courses) {
          // Check if due already exists for this specific course
          const existingDue = await tx.noDue.findFirst({
            where: {
              requestId,
              courseId: course.id,
            },
          });

          if (!existingDue) {
            duesToCreate.push({
              requestId,
              courseId: course.id,
              departmentId: course.departmentId,
              status: NoDueStatus.pending,
              comments: `Course: ${course.name}`, // Keeping for backward compatibility/UI
            });
          }
        }

        if (duesToCreate.length > 0) {
          await tx.noDue.createMany({
            data: duesToCreate,
          });
        }

        return await tx.noDueRequest.findUnique({
          where: { id: requestId },
          include: {
            noDues: {
              include: {
                department: true,
                serviceDepartment: true,
                course: true,
              },
            },
            courseSelections: {
              include: {
                course: true,
              },
            },
            student: true,
          },
        });
      },
      {
        maxWait: 5000,
        timeout: 10000,
      },
    );

    await logAudit({
      req,
      action: "REGISTER_SEMESTER",
      module: "due",
      entityType: "NoDueRequest",
      entityId: result?.id,
      details: { studentId, courseIds, targetSemester, hostelService },
    });

    res
      .status(201)
      .json({ message: "Semester registration successful", request: result });
  } catch (error: any) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

// 3.2 GET /api/staff/approvals
export const getPendingApprovals = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      semester,
      status,
      search,
      type,
      program,
      departmentId,
      page = 1,
      limit = 10,
    } = req.query;

    // Get the authenticated user's ID from JWT
    const authUser = req.user as { userId?: number } | undefined;
    const userId = authUser?.userId ?? null;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Check if the user is an admin
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!dbUser) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    const isAdmin = dbUser.userRoles.some(
      (ur) =>
        ur.role.name.toLowerCase() === "admin" ||
        ur.role.name.toLowerCase() === "super admin",
    );

    // For non-admin users, determine what they can see
    let allowedCourseIds: number[] = [];
    let allowedServiceDeptIds: number[] = [];
    const isSubjectStaff =
      !isAdmin && dbUser.courses && dbUser.courses.length > 0;

    if (!isAdmin) {
      // Get courses the user is linked to
      if (dbUser.courses && dbUser.courses.length > 0) {
        allowedCourseIds = dbUser.courses.map((c) => c.id);
      }

      // Get service departments the user is assigned to
      const assignedServiceDepts = await prisma.serviceDepartment.findMany({
        where: { assignedUserId: userId },
        select: { id: true },
      });
      allowedServiceDeptIds = assignedServiceDepts.map((sd) => sd.id);
    }

    const whereClause: any = {
      request: {
        isArchived: status === "archived",
        student: {
          status: {
            notIn: [StudentStatus.graduated, StudentStatus.deleted],
          },
        },
      },
    };

    // Filter by semester
    if (semester && semester !== "all") {
      whereClause.request.targetSemester = Number(semester);
    }

    // Filter by student search
    if (search) {
      whereClause.request.student = {
        ...whereClause.request.student,
        OR: [
          { name: { contains: search as string, mode: "insensitive" } },
          {
            admission_number: {
              contains: search as string,
              mode: "insensitive",
            },
          },
        ],
      };
    }

    // Filter by program
    if (program && program !== "all") {
      whereClause.request.student = {
        ...whereClause.request.student,
        program: program as string,
      };
    }

    // Filter by department
    if (departmentId && departmentId !== "all") {
      whereClause.request.student = {
        ...whereClause.request.student,
        departmentId: Number(departmentId),
      };
    }

    // Apply user-based filtering for non-admin users
    if (!isAdmin) {
      // Non-admin users can only see dues for their linked courses or assigned service departments
      const orConditions: any[] = [];
      if (allowedCourseIds.length > 0) {
        orConditions.push({ courseId: { in: allowedCourseIds } });
      }
      if (allowedServiceDeptIds.length > 0) {
        orConditions.push({
          serviceDepartmentId: { in: allowedServiceDeptIds },
        });
      }

      if (orConditions.length > 0) {
        whereClause.OR = orConditions;
      } else {
        // User has no linked courses or service departments — return empty results
        res.json({
          data: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            totalPages: 0,
          },
        });
        return;
      }
    }

    // Filter by status
    if (status === "pending") {
      whereClause.status = "pending";
    } else if (status === "cleared") {
      whereClause.status = "cleared";
    } else if (status === "archived") {
      // For archived requests, we also only want to show their pending dues (usually)
      whereClause.status = "pending";
    }

    // Filter by Due Type (Academic vs Service)
    if (type === "academic") {
      whereClause.departmentId = { not: null };
    } else if (type === "service") {
      whereClause.serviceDepartmentId = { not: null };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, dues] = await Promise.all([
      prisma.noDue.count({ where: whereClause }),
      prisma.noDue.findMany({
        where: whereClause,
        include: {
          request: {
            include: {
              student: {
                include: {
                  department: true,
                },
              },
            },
          },
          department: true,
          serviceDepartment: true,
          course: true,
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
    ]);

    const formattedDues = dues.map((due) => {
      let dueType =
        due.course?.name ||
        due.serviceDepartment?.name ||
        due.department?.name ||
        "Unknown";

      if (due.course) {
        dueType = `${due.course.name} (${due.course.type})`;
      } else if (due.comments) {
        dueType = `${dueType} (${due.comments})`;
      }

      return {
        id: due.id,
        requestId: due.requestId,
        studentId: due.request.student.id,
        studentName: due.request.student.name,
        registerNo: due.request.student.admission_number,
        semester: due.request.targetSemester,
        program: due.request.student.program,
        department: due.request.student.department?.name || "N/A",
        dueType,
        status: due.status,
        updatedAt: due.updatedAt,
      };
    });

    res.json({
      data: formattedDues,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Fetch approvals error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch approvals", error: error.message });
  }
};

// Helper to clear a due
export const clearDue = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params; // noDueId
    const authUser = req.user as { userId?: number } | undefined;
    const userId = authUser?.userId;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Verify the user is authorized to clear this due
    const noDueEntry = await prisma.noDue.findUnique({
      where: { id: parseInt(id) },
      include: {
        course: true,
        serviceDepartment: true,
      },
    });

    if (!noDueEntry) {
      res.status(404).json({ message: "Due not found" });
      return;
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: true,
        userRoles: { include: { role: true } },
      },
    });

    const isAdmin = dbUser?.userRoles.some(
      (ur) =>
        ur.role.name.toLowerCase() === "admin" ||
        ur.role.name.toLowerCase() === "super admin",
    );

    if (!isAdmin) {
      // Verify user owns this due's course or service department
      let authorized = false;

      if (noDueEntry.courseId && dbUser?.courses) {
        authorized = dbUser.courses.some((c) => c.id === noDueEntry.courseId);
      }

      if (noDueEntry.serviceDepartmentId && noDueEntry.serviceDepartment) {
        authorized = noDueEntry.serviceDepartment.assignedUserId === userId;
      }

      if (!authorized) {
        res
          .status(403)
          .json({ message: "You are not authorized to clear this due" });
        return;
      }
    }

    console.log("clearDue called with id:", id, "userId:", userId);

    const updatedNoDue = await prisma.noDue.update({
      where: { id: parseInt(id) },
      data: {
        status: NoDueStatus.cleared,
        approvals: {
          create: {
            approverId: Number(userId),
            status: ApprovalStatus.approved,
          },
        },
      },
      include: {
        request: {
          include: { student: true },
        },
        course: true,
        department: true,
        serviceDepartment: true,
      },
    });

    // Send notification to student
    if (updatedNoDue.request?.student) {
      let entityName = "Academic Due";
      if (updatedNoDue.course) entityName = updatedNoDue.course.name;
      else if (updatedNoDue.serviceDepartment)
        entityName = updatedNoDue.serviceDepartment.name;
      else if (updatedNoDue.department)
        entityName = `${updatedNoDue.department.name} Clearance`;

      await prisma.notification.create({
        data: {
          title: "Due Cleared",
          description: `Your clearance for "${entityName}" has been approved.`,
          targetType: "STUDENT",
          targetValue: updatedNoDue.request.student.id.toString(),
          status: "published",
          priority: "NORMAL",
          senderId: Number(userId),
        },
      });
    }

    // Check if all dues for the request are cleared
    const pendingDues = await prisma.noDue.count({
      where: {
        requestId: updatedNoDue.requestId,
        status: { not: NoDueStatus.cleared },
      },
    });

    console.log(
      `RequestId: ${updatedNoDue.requestId}, Pending Dues: ${pendingDues}`,
    );

    if (pendingDues === 0) {
      console.log("All dues cleared. Updating request status to approved.");
      await prisma.noDueRequest.update({
        where: { id: updatedNoDue.requestId },
        data: { status: RequestStatus.approved },
      });
    }

    await logAudit({
      req,
      action: "CLEAR_DUE",
      module: "due",
      entityType: "NoDue",
      entityId: id,
      userId,
      details: {
        requestId: updatedNoDue.requestId,
        studentId: updatedNoDue.request?.student?.id,
        studentName: updatedNoDue.request?.student?.name,
        dueType:
          updatedNoDue.course?.name ||
          updatedNoDue.serviceDepartment?.name ||
          "Academic",
      },
    });

    res.json({ message: "Due cleared", noDue: updatedNoDue });
  } catch (error: any) {
    console.error("Error in clearDue:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Failed to clear due", error: error.message });
    }
  }
};

export const getStudentStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      res.status(400).json({ message: "Student ID is required" });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { id: Number(studentId) },
    });

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    const latestRequest = await prisma.noDueRequest.findFirst({
      where: {
        studentId: Number(studentId),
        isArchived: false,
      },
      orderBy: { requestDate: "desc" },
      include: {
        student: true,
        noDues: {
          include: {
            department: true,
            serviceDepartment: true,
            course: {
              include: {
                staff: true,
              },
            },
          },
        },
        courseSelections: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!latestRequest) {
      res.json({ status: "none", currentSemester: student.currentSemester });
      return;
    }

    res.json({
      status: "active",
      request: latestRequest,
      currentSemester: student.currentSemester,
    });
  } catch (error: any) {
    console.error("Fetch status error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch status", error: error.message });
  }
};

// 3.6 POST /api/nodue/bulk-initiate
export const bulkInitiateNoDue = async (req: Request, res: Response) => {
  try {
    const { semester, program } = req.body;
    const targetSemester = Number(semester);
    const targetProgram = program || "BTECH";

    if (!targetSemester) {
      res.status(400).json({ message: "Semester is required" });
      return;
    }

    console.log(
      `[Bulk Initiate] targetSemester: ${targetSemester}, targetProgram: ${targetProgram}`,
    );

    // 1. Find eligible students
    const students = await prisma.student.findMany({
      where: {
        currentSemester: targetSemester,
        program: targetProgram as any,
        status: StudentStatus.approved,
      },
    });
    console.log(`[Bulk Initiate] Found ${students.length} eligible students`);

    // 2. Find default due configs for this semester + program
    const configs = await prisma.dueConfiguration.findMany({
      where: {
        semester: targetSemester,
        program: targetProgram as any,
        isActive: true,
      },
      include: { serviceDepartment: true },
    });
    console.log(`[Bulk Initiate] Found ${configs.length} default due configs`);

    let count = 0;
    for (const student of students) {
      // 3. Check if already initiated
      const existing = await prisma.noDueRequest.findFirst({
        where: {
          studentId: student.id,
          targetSemester: targetSemester,
          status: { not: "rejected" },
        },
        include: { noDues: true },
      });

      if (existing && existing.noDues.length > 0) {
        continue; // Already initiated with dues
      }

      const duesToCreate: any[] = [];

      // Figure out if we need to create any dues beforehand
      // 4. Default Due entries
      for (const config of configs) {
        if (config.serviceDepartmentId) {
          duesToCreate.push({
            serviceDepartmentId: config.serviceDepartmentId,
            status: NoDueStatus.pending,
          });
        }
      }

      // 5. Course-based entries
      if (student.departmentId) {
        const courses = await prisma.course.findMany({
          where: {
            semester: targetSemester,
            departmentId: student.departmentId,
            isActive: true,
          },
        });
        console.log(
          `[Bulk Initiate] Found ${courses.length} courses for student ${student.id}, dept ${student.departmentId}`,
        );

        for (const course of courses) {
          duesToCreate.push({
            courseId: course.id,
            departmentId: course.departmentId,
            status: NoDueStatus.pending,
            comments: `Course: ${course.name}`,
          });
        }
      } else {
        console.log(
          `[Bulk Initiate] Student ${student.id} has no departmentId`,
        );
      }

      // Skip creating a request entirely if there's no Due configs and no Courses mapped!
      if (duesToCreate.length === 0) {
        console.warn(
          `[Bulk Initiate] WARNING: No dues found for student ${student.id} (no configs, no courses). Skipping!`,
        );
        continue; // Skip without incrementing count!
      }

      let requestId: number;
      if (existing) {
        requestId = existing.id;
        console.log(
          `[Bulk Initiate] Re-using existing request ID: ${requestId} for student ${student.id}`,
        );
      } else {
        // Create new request
        const request = await prisma.noDueRequest.create({
          data: {
            studentId: student.id,
            targetSemester: targetSemester,
            reason: "Semester Registration (Bulk)",
            status: "pending",
          },
        });
        requestId = request.id;
        console.log(
          `[Bulk Initiate] Created new request ID: ${requestId} for student ${student.id}`,
        );
      }

      count++;

      // Mapped out requestId
      const finalDuesToCreate = duesToCreate.map((d) => ({ ...d, requestId }));

      console.log(
        `[Bulk Initiate] Creating ${finalDuesToCreate.length} dues for student ${student.id}`,
      );
      await prisma.noDue.createMany({ data: finalDuesToCreate });

      // 6. Queue email
      if (student.email) {
        await prisma.emailQueue.create({
          data: {
            to: student.email,
            subject: "No Due Clearance Initiated",
            content:
              "The due page is open now, you can access it in your student profile to clear your dues.",
            description: `Bulk initiation for ${targetProgram} Semester ${targetSemester}`,
            status: "PENDING",
          },
        });
      }
    }

    if (count === 0 && students.length > 0) {
      return res.status(400).json({
        message:
          "Failed to initiate: No 'Default Dues' configured in Settings, and no Courses found for this semester. No dues to assign.",
      });
    }

    await logAudit({
      req,
      action: "BULK_INITIATE_NODUE",
      module: "due",
      entityType: "NoDueRequest",
      details: {
        semester: targetSemester,
        program: targetProgram,
        studentsInitiated: count,
      },
    });

    res.json({ message: `Successfully initiated dues for ${count} students` });
  } catch (error) {
    console.error("Error bulk initiating:", error);
    res.status(500).json({ message: "Failed to initiate bulk no due" });
  }
};

// 3.6.1 POST /api/nodue/bulk-initiate-check
export const bulkInitiateCheck = async (req: Request, res: Response) => {
  try {
    const { semester, program } = req.body;
    const targetSemester = Number(semester);
    const targetProgram = program || "BTECH";

    if (!targetSemester) {
      res.status(400).json({ message: "Semester is required" });
      return;
    }

    const totalStudents = await prisma.student.count({
      where: {
        currentSemester: targetSemester,
        program: targetProgram as any,
        status: StudentStatus.approved,
      },
    });

    const initiatedStudents = await prisma.student.count({
      where: {
        currentSemester: targetSemester,
        program: targetProgram as any,
        requests: {
          some: {
            targetSemester: targetSemester,
            status: { not: "rejected" },
            noDues: { some: {} },
          },
        },
      },
    });

    res.json({
      total: totalStudents,
      initiated: initiatedStudents,
      toBeInitiated: totalStudents - initiatedStudents,
    });
  } catch (error) {
    console.error("Error checking bulk stats:", error);
    res.status(500).json({ message: "Failed to check bulk stats" });
  }
};

// 3.8 POST /api/staff/bulk-clear
export const bulkClearDues = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { dueIds } = req.body; // Expecting array of due IDs
    const authUser = req.user as { userId?: number } | undefined;
    const userId = authUser?.userId;

    if (!dueIds || !Array.isArray(dueIds) || dueIds.length === 0) {
      res.status(400).json({ message: "No due IDs provided" });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: true,
        userRoles: { include: { role: true } },
      },
    });

    const isAdmin = dbUser?.userRoles.some(
      (ur) =>
        ur.role.name.toLowerCase() === "admin" ||
        ur.role.name.toLowerCase() === "super admin",
    );

    // For non-admin users, verify they own all the dues they're trying to clear
    if (!isAdmin) {
      const duesToVerify = await prisma.noDue.findMany({
        where: { id: { in: dueIds } },
        include: {
          course: true,
          serviceDepartment: true,
        },
      });

      const userCourseIds = new Set(dbUser?.courses?.map((c) => c.id) || []);

      for (const due of duesToVerify) {
        let authorized = false;
        if (due.courseId) {
          authorized = userCourseIds.has(due.courseId);
        }
        if (due.serviceDepartmentId && due.serviceDepartment) {
          authorized = due.serviceDepartment.assignedUserId === userId;
        }
        if (!authorized) {
          res.status(403).json({
            message:
              "You are not authorized to clear one or more of these dues",
          });
          return;
        }
      }
    }

    // Fetch details of all dues being cleared to notify students
    const duesToClear = await prisma.noDue.findMany({
      where: {
        id: { in: dueIds },
        status: { not: NoDueStatus.cleared },
      },
      include: {
        request: {
          include: { student: true },
        },
        course: true,
        department: true,
        serviceDepartment: true,
      },
    });

    // Update all provided dues to cleared
    await prisma.noDue.updateMany({
      where: {
        id: { in: dueIds },
        status: { not: NoDueStatus.cleared },
      },
      data: {
        status: NoDueStatus.cleared,
      },
    });

    // Send notifications to students
    const studentNotificationsMap = new Map<number, string[]>();
    duesToClear.forEach((due) => {
      if (due.request?.student) {
        const studentId = due.request.student.id;
        let entityName = "Academic Due";
        if (due.course) entityName = due.course.name;
        else if (due.serviceDepartment) entityName = due.serviceDepartment.name;
        else if (due.department)
          entityName = `${due.department.name} Clearance`;

        if (!studentNotificationsMap.has(studentId)) {
          studentNotificationsMap.set(studentId, []);
        }
        studentNotificationsMap.get(studentId)?.push(entityName);
      }
    });

    // Create notifications for each student
    for (const [
      studentId,
      clearedEntities,
    ] of studentNotificationsMap.entries()) {
      const entitiesList = clearedEntities.join(", ");
      await prisma.notification.create({
        data: {
          title: "Dues Cleared",
          description: `Your clearance(s) for "${entitiesList}" have been approved.`,
          targetType: "STUDENT",
          targetValue: studentId.toString(),
          status: "published",
          priority: "NORMAL",
          senderId: Number(userId),
        },
      });
    }

    // Create approval records for audit
    // Note: createMany is supported for top-level models
    const approvalData = dueIds.map((id: number) => ({
      noDueId: id,
      approverId: Number(userId),
      status: ApprovalStatus.approved,
    }));

    await prisma.noDueApproval.createMany({
      data: approvalData,
    });

    // Check and update Request status for affected requests
    // 1. Find all distinct requests involved
    const affectedDues = await prisma.noDue.findMany({
      where: { id: { in: dueIds } },
      select: { requestId: true },
    });
    const requestIds = [...new Set(affectedDues.map((d) => d.requestId))];

    // 2. Check each request
    for (const rid of requestIds) {
      const pendingCount = await prisma.noDue.count({
        where: {
          requestId: rid,
          status: { not: NoDueStatus.cleared },
        },
      });

      if (pendingCount === 0) {
        await prisma.noDueRequest.update({
          where: { id: rid },
          data: { status: RequestStatus.approved },
        });
      }
    }

    await logAudit({
      req,
      action: "BULK_CLEAR_DUES",
      module: "due",
      entityType: "NoDue",
      userId,
      details: { dueIds, count: dueIds.length },
    });

    res.json({ message: `Successfully cleared ${dueIds.length} dues` });
  } catch (error: any) {
    console.error("Bulk clear error:", error);
    res
      .status(500)
      .json({ message: "Failed to bulk clear dues", error: error.message });
  }
};

// 3.9 POST /api/nodue/send-emails
export const sendPendingEmails = async (req: Request, res: Response) => {
  try {
    const pendingEmails = await prisma.emailQueue.findMany({
      where: { status: "PENDING" },
      take: 50, // Process in batches
    });

    if (pendingEmails.length === 0) {
      res.json({ message: "No pending emails to send." });
      return;
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const email of pendingEmails) {
      try {
        // Here you would integrate with your actual email service (e.g., Nodemailer, SendGrid, AWS SES)
        // For now, we simulate sending the email
        console.log(`Sending email to ${email.to}: ${email.subject}`);

        // Simulate async email sending
        await new Promise((resolve) => setTimeout(resolve, 100));

        await prisma.emailQueue.update({
          where: { id: email.id },
          data: { status: "SENT" },
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send email to ${email.to}:`, err);
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: { status: "FAILED" },
        });
        failedCount++;
      }
    }

    res.json({
      message: `Processed ${pendingEmails.length} emails.`,
      sent: sentCount,
      failed: failedCount,
    });
  } catch (error: any) {
    console.error("Error sending pending emails:", error);
    res
      .status(500)
      .json({ message: "Failed to send emails", error: error.message });
  }
};
