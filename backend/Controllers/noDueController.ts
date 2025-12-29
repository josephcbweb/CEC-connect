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
  res: Response
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
      }
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
  res: Response
): Promise<void> => {
  try {
    const { semester, status, search, type } = req.query;

    // Build query
    const whereClause: any = {};

    if (status) {
      whereClause.status = status as string;
    } else {
      whereClause.status = "pending"; // Default to pending
    }

    // Filter by type
    if (type === "academic") {
      whereClause.departmentId = { not: null };
    } else if (type === "service") {
      whereClause.serviceDepartmentId = { not: null };
    }

    // Filter by semester (on the Request)
    if (semester) {
      whereClause.request = {
        targetSemester: parseInt(semester as string),
      };
    }

    // Search by student name or regNo
    if (search) {
      whereClause.request = {
        ...whereClause.request,
        student: {
          OR: [
            { name: { contains: search as string, mode: "insensitive" } },
            {
              admission_number: {
                contains: search as string,
                mode: "insensitive",
              },
            }, // Assuming admission_number is regNo
          ],
        },
      };
    }

    const approvals = await prisma.noDue.findMany({
      where: whereClause,
      include: {
        department: true,
        serviceDepartment: true,
        request: {
          include: {
            student: true,
            courseSelections: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform data for frontend
    const formattedApprovals = approvals.map((approval) => {
      let dueType =
        approval.department?.name ||
        approval.serviceDepartment?.name ||
        "Unknown";

      // If comments contain "Course: ", use that as the due type
      if (approval.comments && approval.comments.startsWith("Course: ")) {
        dueType = approval.comments.replace("Course: ", "");
      }

      return {
        id: approval.id,
        studentName: approval.request.student.name,
        registerNo: approval.request.student.admission_number,
        semester: approval.request.targetSemester,
        dueType: dueType,
        status: approval.status,
        courses: approval.request.courseSelections
          .map((cs) => cs.course)
          .filter((c) => {
            // If dueType is a specific course name, only show that course
            if (approval.comments && approval.comments.startsWith("Course: ")) {
              return c.name === dueType;
            }
            // Otherwise show all courses for the department
            return c.departmentId === approval.departmentId;
          }),
        updatedAt: approval.updatedAt,
      };
    });

    res.json(formattedApprovals);
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
      `RequestId: ${updatedNoDue.requestId}, Pending Dues: ${pendingDues}`
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
  res: Response
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

    let count = 0;
    for (const student of students) {
      // Check if request exists
      const existing = await prisma.noDueRequest.findFirst({
        where: {
          studentId: student.id,
          targetSemester: targetSemester,
          status: { not: "rejected" },
        },
      });
      if (existing) continue;

      // Create Request
      const request = await prisma.noDueRequest.create({
        data: {
          studentId: student.id,
          targetSemester: targetSemester,
          reason: "Semester Registration (Bulk)",
          status: "pending",
        },
      });

      // Create NoDue items
      for (const config of configs) {
        if (config.serviceDepartmentId) {
          await prisma.noDue.create({
            data: {
              requestId: request.id,
              serviceDepartmentId: config.serviceDepartmentId,
              status: "pending",
            },
          });
        }
      }
      count++;
    }
    res.json({ message: `Initiated for ${count} students` });
  } catch (error) {
    console.error("Error bulk initiating:", error);
    res.status(500).json({ message: "Failed to initiate bulk no due" });
  }
};
