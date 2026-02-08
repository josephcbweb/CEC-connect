import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../utils/jwt";
import {
  ApprovalStatus,
  CourseType,
  NoDueStatus,
  RequestStatus,
  RequestWorkflowStatus,
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
          // Fetch configured dues for this semester
          const dueConfigs = await tx.dueConfiguration.findMany({
            where: { semester: targetSemester, isActive: true },
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
          // MIGRATION FIX: Check for and remove any "Generic" (Department-level) due for this department
          // This prevents having both a "Grouped" due and "Specific" dues
          const genericDue = await tx.noDue.findFirst({
            where: {
              requestId,
              departmentId: course.departmentId,
              comments: null, // Generic dues have no comments
              status: NoDueStatus.pending,
            },
          });

          if (genericDue) {
            await tx.noDue.delete({
              where: { id: genericDue.id },
            });
          }

          // Check if due already exists for this specific course (using comments as a tag)
          // We use "Course: <CourseName>" to distinguish them
          const courseTag = `Course: ${course.name}`;

          const existingDue = await tx.noDue.findFirst({
            where: {
              requestId,
              departmentId: course.departmentId,
              comments: courseTag,
            },
          });

          if (!existingDue) {
            duesToCreate.push({
              requestId,
              departmentId: course.departmentId,
              status: NoDueStatus.pending,
              comments: courseTag, // Store course name to distinguish
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
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      semester,
      status,
      search,
      type,
      userId: queryUserId,
      page = 1,
      limit = 10,
    } = req.query;

    // Authorization Check: If userId is provided, check if they are limited to specific courses
    const userId = queryUserId ? Number(queryUserId) : null;
    let allowedCourseComments: string[] = [];
    let isSubjectStaff = false;

    if (userId) {
      const staffUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { courses: true },
      });

      if (staffUser && staffUser.courses && staffUser.courses.length > 0) {
        isSubjectStaff = true;
        allowedCourseComments = staffUser.courses.map(
          (c) => `Course: ${c.name}`,
        );
      }
    }

    const whereClause: any = {
      isArchived: false,
    };

    // Filter by semester
    if (semester && semester !== "all") {
      whereClause.targetSemester = Number(semester);
    }

    // Filter by student search
    if (search) {
      whereClause.student = {
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

    // Apply Subject Staff limitation common filter
    if (isSubjectStaff) {
      // Only show requests that have at least one due belonging to the staff's courses
      whereClause.noDues = {
        some: {
          comments: { in: allowedCourseComments },
        },
      };
    }

    // Filter by status (GROUPED LOGIC)
    // "pending" = Has at least one pending due
    // "cleared" = All dues are cleared (and has dues)
    if (status === "pending") {
      whereClause.noDues = {
        ...whereClause.noDues, // Merge with subject staff filter if exists
        some: {
          ...(whereClause.noDues?.some || {}),
          status: "pending",
        },
      };
    } else if (status === "cleared") {
      whereClause.noDues = {
        ...whereClause.noDues,
        every: { status: "cleared" },
        some: { ...(whereClause.noDues?.some || {}) }, // Ensure it has at least one due
      };
      // Also optionally check request status if it's updated correctly
      // whereClause.status = "approved";
    }

    // Filter by Due Type (Academic vs Service)
    // This is tricky when grouping requests. We likely want to show requests
    // that contain *at least one* due of the selected type.
    if (type === "academic") {
      whereClause.noDues = {
        ...whereClause.noDues,
        some: {
          ...(whereClause.noDues?.some || {}),
          departmentId: { not: null },
        },
      };
    } else if (type === "service") {
      whereClause.noDues = {
        ...whereClause.noDues,
        some: {
          ...(whereClause.noDues?.some || {}),
          serviceDepartmentId: { not: null },
        },
      };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, requests] = await Promise.all([
      prisma.noDueRequest.count({ where: whereClause }),
      prisma.noDueRequest.findMany({
        where: whereClause,
        include: {
          student: true,
          noDues: {
            include: {
              department: true,
              serviceDepartment: true,
            },
            orderBy: { id: "asc" },
          },
          courseSelections: {
            include: { course: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
    ]);

    const formattedRequests = requests.map((req) => {
      // Filter dues to only show what the staff is allowed to see/act on
      const visibleDues = isSubjectStaff
        ? req.noDues.filter(
            (d) => d.comments && allowedCourseComments.includes(d.comments),
          )
        : req.noDues;

      return {
        id: req.id,
        studentName: req.student.name,
        registerNo: req.student.admission_number,
        semester: req.targetSemester,
        status:
          visibleDues.every((d) => d.status === "cleared") &&
          visibleDues.length > 0
            ? "cleared"
            : "pending",
        dues: visibleDues.map((due) => {
          let dueType =
            due.department?.name || due.serviceDepartment?.name || "Unknown";
          if (due.comments && due.comments.startsWith("Course: ")) {
            dueType = due.comments.replace("Course: ", "");
          } else if (due.comments) {
            dueType = `${dueType} (${due.comments})`;
          }
          return {
            id: due.id,
            dueType,
            status: due.status,
            updatedAt: due.updatedAt,
          };
        }),
        updatedAt: req.updatedAt,
      };
    });

    res.json({
      data: formattedRequests,
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
export const clearDue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // noDueId
    const { userId } = req.body;

    console.log("clearDue called with id:", id, "userId:", userId);

    if (!userId) {
      console.log("userId missing, sending 400");
      res.status(400).json({ message: "User ID is required" });
      return;
    }

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
    });

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
    const { semester } = req.body;
    const targetSemester = Number(semester);

    if (!targetSemester) {
      res.status(400).json({ message: "Semester is required" });
      return;
    }

    // Find all students in this semester
    const students = await prisma.student.findMany({
      where: { currentSemester: targetSemester },
    });

    // Find configs for this semester
    const configs = await prisma.dueConfiguration.findMany({
      where: { semester: targetSemester, isActive: true },
      include: { serviceDepartment: true },
    });

    // Fetch Standard Service Departments
    const serviceDepts = await prisma.serviceDepartment.findMany({
      where: { name: { in: ["Library", "Accounts", "Hostel"] } },
    });
    const libraryDept = serviceDepts.find((d) => d.name === "Library");
    const accountsDept = serviceDepts.find((d) => d.name === "Accounts");
    const hostelDept = serviceDepts.find((d) => d.name === "Hostel");

    let count = 0;
    for (const student of students) {
      let requestId: number;

      // Check if request exists
      const existing = await prisma.noDueRequest.findFirst({
        where: {
          studentId: student.id,
          targetSemester: targetSemester,
          status: { not: "rejected" },
        },
        include: { noDues: true },
      });

      if (existing) {
        if (existing.noDues.length > 0) {
          continue; // Already initiated and has dues
        }
        requestId = existing.id; // Exists but empty (backfill)
        count++;
      } else {
        // Create Request
        const request = await prisma.noDueRequest.create({
          data: {
            studentId: student.id,
            targetSemester: targetSemester,
            reason: "Semester Registration (Bulk)",
            status: "pending",
          },
        });
        requestId = request.id;
        count++;
      }

      const duesToCreate = [];

      // 1. Configured Defaults
      if (configs.length > 0) {
        for (const config of configs) {
          if (config.serviceDepartmentId) {
            duesToCreate.push({
              requestId: requestId,
              serviceDepartmentId: config.serviceDepartmentId,
              status: NoDueStatus.pending,
            });
          }
        }
      } else {
        // 2. Fallbacks if no config
        if (libraryDept) {
          duesToCreate.push({
            requestId: requestId,
            serviceDepartmentId: libraryDept.id,
            status: NoDueStatus.pending,
          });
        }
        if (accountsDept) {
          duesToCreate.push({
            requestId: requestId,
            serviceDepartmentId: accountsDept.id,
            status: NoDueStatus.pending,
          });
        }
        if (student.hostel_service && hostelDept) {
          duesToCreate.push({
            requestId: requestId,
            serviceDepartmentId: hostelDept.id,
            status: NoDueStatus.pending,
          });
        }
      }

      // 3. Student's Academic Department
      if (student.departmentId) {
        duesToCreate.push({
          requestId: requestId,
          departmentId: student.departmentId,
          status: NoDueStatus.pending,
          comments: "Department Clearance",
        });
      }

      if (duesToCreate.length > 0) {
        await prisma.noDue.createMany({
          data: duesToCreate,
        });
      }
    }
    res.json({ message: `Initiated for ${count} students` });
  } catch (error) {
    console.error("Error bulk initiating:", error);
    res.status(500).json({ message: "Failed to initiate bulk no due" });
  }
};

// 3.6.1 POST /api/nodue/bulk-initiate-check
export const bulkInitiateCheck = async (req: Request, res: Response) => {
  try {
    const { semester } = req.body;
    const targetSemester = Number(semester);

    if (!targetSemester) {
      res.status(400).json({ message: "Semester is required" });
      return;
    }

    const totalStudents = await prisma.student.count({
      where: { currentSemester: targetSemester },
    });

    const initiatedStudents = await prisma.student.count({
      where: {
        currentSemester: targetSemester,
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
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { dueIds, userId } = req.body; // Expecting array of due IDs

    if (!dueIds || !Array.isArray(dueIds) || dueIds.length === 0) {
      res.status(400).json({ message: "No due IDs provided" });
      return;
    }

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

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

    res.json({ message: `Successfully cleared ${dueIds.length} dues` });
  } catch (error: any) {
    console.error("Bulk clear error:", error);
    res
      .status(500)
      .json({ message: "Failed to bulk clear dues", error: error.message });
  }
};
