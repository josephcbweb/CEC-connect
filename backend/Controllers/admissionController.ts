import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  StudentStatus,
  AdmissionType,
  Program,
  RequestStatus,
} from "../generated/prisma/enums";
import { sendAdmissionConfirmation } from "../services/mailService";

// Get all admissions with filtering and pagination
export const getAdmissions = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "20",
      status,
      program,
      search,
      admissionType,
      departmentId,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    } else {
      // Exclude graduated and deleted when showing "all" or no status
      where.status = {
        notIn: [StudentStatus.graduated, StudentStatus.deleted],
      };
    }

    if (program && program !== "all") {
      where.program = program;
    }

    if (admissionType && admissionType !== "all") {
      where.admission_type = admissionType;
    }

    if (departmentId && departmentId !== "all") {
      where.OR = [
        { departmentId: parseInt(departmentId as string) },
        { preferredDepartmentId: parseInt(departmentId as string) },
      ];
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        {
          admission_number: { contains: search as string, mode: "insensitive" },
        },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          department: true,
          preferredDepartment: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.student.count({ where }),
    ]);

    res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching admissions:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch admissions" });
  }
};

// Get admission statistics
export const getStats = async (req: Request, res: Response) => {
  try {
    const [total, pending, approved, rejected, waitlisted, unassignedApproved] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: StudentStatus.pending } }),
      prisma.student.count({ where: { status: StudentStatus.approved } }),
      prisma.student.count({ where: { status: StudentStatus.rejected } }),
      prisma.student.count({ where: { status: StudentStatus.waitlisted } }),
      prisma.student.count({ where: { status: StudentStatus.approved, classId: null } }),
    ]);

    // Program-wise stats
    const btechCount = await prisma.student.count({
      where: { program: Program.BTECH },
    });
    const mtechCount = await prisma.student.count({
      where: { program: Program.MTECH },
    });
    const mcaCount = await prisma.student.count({
      where: { program: Program.MCA },
    });

    // Admission type stats
    const regularCount = await prisma.student.count({
      where: { admission_type: AdmissionType.regular },
    });
    const lateralCount = await prisma.student.count({
      where: { admission_type: AdmissionType.lateral },
    });
    const nriCount = await prisma.student.count({
      where: { admission_type: AdmissionType.NRI },
    });
    const managementCount = await prisma.student.count({
      where: { admission_type: AdmissionType.management },
    });

    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        waitlisted,
        unassignedApproved,
        byProgram: {
          btech: btechCount,
          mtech: mtechCount,
          mca: mcaCount,
        },
        byAdmissionType: {
          regular: regularCount,
          lateral: lateralCount,
          nri: nriCount,
          management: managementCount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch statistics" });
  }
};

// Get single admission by ID
export const getAdmissionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: {
        department: true,
      },
    });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Admission not found" });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    console.error("Error fetching admission:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch admission details" });
  }
};

// Helper to generate admission number
const generateAdmissionNumber = async (departmentId: number) => {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department) throw new Error("Department not found");

  let deptCode = department.department_code.toLowerCase();

  // Custom mappings
  if (deptCode === "cse") deptCode = "cs";

  const year = new Date().getFullYear();
  const lowerPrefix = `cec${String(year).slice(-2)}${deptCode}`;
  const upperPrefix = `CEC${String(year).slice(-2)}${deptCode.toUpperCase()}`;

  const count = await prisma.student.count({
    where: {
      OR: [
        { admission_number: { startsWith: lowerPrefix } },
        { admission_number: { startsWith: upperPrefix } },
      ],
    },
  });

  return `${upperPrefix}${String(count + 1).padStart(3, "0")}`;
};

// Update admission status
export const updateAdmissionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!Object.values(StudentStatus).includes(status)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid status value" });
    }

    const studentId = parseInt(id);
    let updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // If approving, generate new admission number
    if (status === StudentStatus.approved) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        return res
          .status(404)
          .json({ success: false, error: "Student not found" });
      }

      // Use assigned department or preferred department
      const deptId = student.departmentId || student.preferredDepartmentId;

      if (!deptId) {
        return res.status(400).json({
          success: false,
          error: "Cannot approve student without a department assigned",
        });
      }

      try {
        const admissionNumber = await generateAdmissionNumber(deptId);
        updateData.admission_number = admissionNumber;

        // If not already assigned to a department, assign them to the preferred one
        if (!student.departmentId) {
          updateData.departmentId = deptId;
        }

      } catch (err: any) {
        return res.status(500).json({
          success: false,
          error: `Failed to generate admission number: ${err.message}`,
        });
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
    });

    // TODO: Send notification to student about status change

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating admission status:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update admission status" });
  }
};

// Delete admission entry
export const deleteAdmissionEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = parseInt(id);

    // Verify student exists and is pending
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ success: false, error: "Admission entry not found" });
    }

    if (student.status !== "pending") {
      return res.status(400).json({ success: false, error: "Only pending applications can be deleted" });
    }

    await prisma.student.delete({
      where: { id: studentId },
    });

    res.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admission entry:", error);
    res.status(500).json({ success: false, error: "Failed to delete admission entry" });
  }
};

// Get admission windows
export const getAdmissionWindows = async (req: Request, res: Response) => {
  try {
    const windows = await prisma.admissionWindow.findMany({
      include: { batch: true }, // Crucial for displaying batch name in frontend
      orderBy: { program: "asc" },
    });

    const now = new Date();
    // Normalize dates to include full days (start of day to end of day)
    const startOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(0, 0, 0, 0);
      return nd;
    };
    const endOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(23, 59, 59, 999);
      return nd;
    };
    // Dynamically calculate status for the frontend
    const processedWindows = windows.map((window) => {
      const start = startOfDay(new Date(window.startDate));
      const end = endOfDay(new Date(window.endDate));
      return {
        ...window,
        isOpen: window.isOpen && now >= start && now <= end,
      };
    });

    res.json({ success: true, data: processedWindows });
  } catch (error) {
    console.error("Error fetching admission windows:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch admission windows" });
  }
};

// Update admission window
export const updateAdmissionWindow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isOpen, startDate, endDate, description } = req.body;

    const current = await prisma.admissionWindow.findUnique({
      where: { id: parseInt(id) },
    });
    if (!current)
      return res
        .status(404)
        .json({ success: false, error: "Window not found" });

    const newStart = startDate ? new Date(startDate) : current.startDate;
    const newEnd = endDate ? new Date(endDate) : current.endDate;
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If start date is being changed, it cannot be in the past
    if (startDate && new Date(newStart).getTime() !== new Date(current.startDate).getTime()) {
      if (new Date(newStart) < today) {
        return res.status(400).json({
          success: false,
          error: "Start date cannot be in the past.",
        });
      }
    }

    if (new Date(newEnd) <= new Date(newStart)) {
      return res.status(400).json({
        success: false,
        error: "End date must be after start date.",
      });
    }

    // Re-validate isOpen: Must be true only if within date range
    const startOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(0, 0, 0, 0);
      return nd;
    };
    const endOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(23, 59, 59, 999);
      return nd;
    };
    const ns = startOfDay(newStart);
    const ne = endOfDay(newEnd);
    const validatedIsOpen =
      isOpen !== undefined
        ? isOpen && now >= ns && now <= ne
        : current.isOpen && now >= ns && now <= ne;

    const updatedWindow = await prisma.admissionWindow.update({
      where: { id: parseInt(id) },
      data: {
        isOpen: validatedIsOpen,
        startDate: newStart,
        endDate: newEnd,
        description,
      },
    });

    res.json({ success: true, data: updatedWindow });
  } catch (error) {
    console.error("Error updating admission window:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update admission window" });
  }
};

// Delete admission window
export const deleteAdmissionWindow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Use a transaction with custom timeouts to prevent P2028
    await prisma.$transaction(
      async (tx) => {
        // 1. Fetch window to get the linked batchId
        const window = await tx.admissionWindow.findUnique({
          where: { id: parseInt(id) },
          select: { batchId: true },
        });

        if (!window) {
          throw new Error("Admission window not found");
        }

        // 2. Activate the Batch (UPCOMING -> ACTIVE)
        if (window.batchId) {
          await tx.batch.update({
            where: { id: window.batchId },
            data: { status: "ACTIVE" },
          });
        }

        // 3. Delete the AdmissionWindow record
        await tx.admissionWindow.delete({
          where: { id: parseInt(id) },
        });
      },
      {
        maxWait: 10000, // Wait 10s for a connection
        timeout: 20000, // Allow 20s for the work to finish
      },
    );

    res.json({
      success: true,
      message: "Admission finalized: Batch is now ACTIVE and window removed.",
    });
  } catch (error: any) {
    console.error("Error deleting admission window:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to finalize admission",
    });
  }
};

// Create admission window
export const createAdmissionWindow = async (req: Request, res: Response) => {
  try {
    const {
      program,
      startDate,
      endDate,
      description,
      isOpen,
      batchName,
      startYear,
      endYear,
      departmentIds,
    } = req.body;

    // 1. Basic validation
    if (
      !batchName ||
      !startYear ||
      !endYear ||
      !departmentIds ||
      !Array.isArray(departmentIds)
    ) {
      return res.status(400).json({
        success: false,
        error: "Batch details and at least one department are required.",
      });
    }

    // 2. Date validation
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start < now) {
      return res.status(400).json({
        success: false,
        error: "Start date cannot be in the past.",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        error: "End date must be after start date.",
      });
    }

    // 3. Ensure departments exist for this program
    const departmentsForProgram = await prisma.department.findMany({
      where: {
        id: { in: departmentIds.map(id => Number(id)) },
        program: program as Program,
      }
    });

    if (departmentsForProgram.length === 0) {
      return res.status(400).json({
        success: false,
        error: `No valid departments found for program ${program}. Window cannot be created.`,
      });
    }

    // 4. Run the transaction with increased timeout settings
    const result = await prisma.$transaction(
      async (tx) => {
        // Check if window already exists for this program
        const existingWindow = await tx.admissionWindow.findFirst({
          where: { program },
        });

        if (existingWindow) {
          // Throwing error inside transaction triggers automatic rollback
          throw new Error(
            `Admission window for ${program.toUpperCase()} already exists`,
          );
        }

        // Create the Batch and link Departments
        const newBatch = await tx.batch.create({
          data: {
            name: batchName,
            startYear: Number(startYear),
            endYear: Number(endYear),
            status: "UPCOMING",
            batchDepartments: {
              create: departmentIds.map((deptId: number) => ({
                departmentId: Number(deptId),
              })),
            },
          },
        });

        // Create the Admission Window
        const newWindow = await tx.admissionWindow.create({
          data: {
            program,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            description,
            isOpen: isOpen ?? true,
            batchId: newBatch.id, // Ensure this link is present
          },
        });

        return { newBatch, newWindow };
      },
      {
        // P2028 FIX: Give the engine more time to acquire a connection and finish
        maxWait: 10000, // default is 2s, increased to 10s
        timeout: 20000, // default is 5s, increased to 20s
      },
    );

    res.status(201).json({
      success: true,
      message: "Admission window opened and Batch initialized successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error setting up admission:", error);

    // Handle the specific transaction timeout error for better UX
    if (error.code === "P2028") {
      return res.status(504).json({
        success: false,
        error: "Database is busy. Please try again in a few seconds.",
      });
    }

    res.status(error.message?.includes("already exists") ? 400 : 500).json({
      success: false,
      error: error.message || "Failed to setup admission window and batch",
    });
  }
};

// Check admission status (public endpoint for students)
export const checkAdmissionStatus = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();

    const windows = await prisma.admissionWindow.findMany();

    const status: any = {
      admissionsOpen: {},
    };

    const startOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(0, 0, 0, 0);
      return nd;
    };
    const endOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(23, 59, 59, 999);
      return nd;
    };

    windows.forEach((window) => {
      const start = startOfDay(new Date(window.startDate));
      const end = endOfDay(new Date(window.endDate));
      const isWithinDateRange = currentDate >= start && currentDate <= end;
      const isOpen = window.isOpen && isWithinDateRange;

      status.admissionsOpen[window.program] = {
        open: isOpen,
        deadline: window.endDate.toISOString().split("T")[0],
        description:
          window.description || `${window.program.toUpperCase()} admissions`,
      };
    });

    res.json(status);
  } catch (error) {
    console.error("Error checking admission status:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to check admission status" });
  }
};

// Validate email and Aadhaar (for admission form)
export const validateStudent = async (req: Request, res: Response) => {
  try {
    const { email, aadhaar } = req.body;

    const [emailExists, aadhaarExists] = await Promise.all([
      email ? prisma.student.findUnique({ where: { email } }) : null,
      aadhaar
        ? prisma.student.findUnique({ where: { aadhaar_number: aadhaar } })
        : null,
    ]);

    if (emailExists) {
      return res.status(409).json({
        success: false,
        emailExists: true,
        message: "An account with this email already exists",
      });
    }

    if (aadhaarExists) {
      return res.status(409).json({
        success: false,
        aadhaarExists: true,
        message: "An account with this Aadhaar number already exists",
      });
    }

    res.json({
      success: true,
      emailExists: false,
      aadhaarExists: false,
      message: "Validation passed",
    });
  } catch (error) {
    console.error("Error validating student:", error);
    res.status(500).json({ success: false, error: "Validation failed" });
  }
};

// Submit admission form (for students)
// Get departments for public admission form
export const getPublicDepartments = async (req: Request, res: Response) => {
  try {
    const { program } = req.query;

    if (!program || typeof program !== "string") {
      return res.status(400).json({
        success: false,
        error: "Program parameter is required",
      });
    }

    // 1. Find the OPEN admission window for this program
    // We fetch all potentially open windows and filter in memory to match the flexible date logic
    // used in checkAdmissionStatus (allowing validation until end of the day).
    const windows = await prisma.admissionWindow.findMany({
      where: {
        program: program as Program,
        isOpen: true,
      },
      include: {
        batch: {
          include: {
            batchDepartments: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();
    const startOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(0, 0, 0, 0);
      return nd;
    };
    const endOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(23, 59, 59, 999);
      return nd;
    };

    const activeWindow = windows.find((window) => {
      const start = startOfDay(new Date(window.startDate));
      const end = endOfDay(new Date(window.endDate));
      return now >= start && now <= end;
    });

    if (!activeWindow || !activeWindow.batch) {
      // If no window is open, return empty list gracefully.
      return res.json({
        success: true,
        data: [],
        message: "No active admission window found for this program.",
      });
    }

    // 2. Extract departments from the batch
    const departments = activeWindow.batch.batchDepartments.map((bd) => ({
      id: bd.department.id,
      name: bd.department.name,
      department_code: bd.department.department_code,
    }));

    // Sort alphabetically
    departments.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch departments",
    });
  }
};

// Auto-assign entire batch
export const autoAssignBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.body;

    if (!batchId) {
      return res.status(400).json({
        success: false,
        error: "Batch ID is required",
      });
    }

    // 1. Fetch Batch, its Admission Window (to get program), and all its Departments/Classes
    const batch = await prisma.batch.findUnique({
      where: { id: parseInt(batchId) },
      include: {
        admissionWindow: true,
        batchDepartments: {
          include: {
            department: true,
            classes: {
              include: {
                _count: { select: { students: true } }
              }
            }
          }
        }
      }
    });

    if (!batch) {
      return res.status(404).json({ success: false, error: "Batch not found" });
    }

    if (!batch.admissionWindow) {
      return res.status(400).json({ success: false, error: "Batch has no associated Admission Window" });
    }

    const program = batch.admissionWindow.program;

    // 2. Fetch all Approved unassigned students for this program
    const unassignedStudents = await prisma.student.findMany({
      where: {
        program: program,
        status: "approved",
        classId: null,
      }
    });

    if (unassignedStudents.length === 0) {
      return res.status(400).json({ success: false, error: "No unassigned approved students found for this batch's program." });
    }

    // 3. Group students by their preferred department
    const studentsByDepartment: Record<number, typeof unassignedStudents> = {};
    unassignedStudents.forEach(student => {
      if (!student.preferredDepartmentId) return; // Skip if no preference, they must be assigned manually
      if (!studentsByDepartment[student.preferredDepartmentId]) {
        studentsByDepartment[student.preferredDepartmentId] = [];
      }
      studentsByDepartment[student.preferredDepartmentId].push(student);
    });

    const assignments: { studentId: number; classId: number; departmentId: number }[] = [];
    let totalAssigned = 0;
    const missingClassesDepts: string[] = [];

    // 4. Distribute students evenly into classes per department
    for (const batchDept of batch.batchDepartments) {
      const deptId = batchDept.departmentId;
      const studentsForDept = studentsByDepartment[deptId] || [];

      if (studentsForDept.length === 0) continue;

      if (batchDept.classes.length === 0) {
        missingClassesDepts.push(batchDept.department.name);
        continue;
      }

      // Sort classes by current student count to ensure even distribution
      const sortedClasses = batchDept.classes.sort((a, b) => a._count.students - b._count.students);
      const numClasses = sortedClasses.length;

      studentsForDept.forEach((student, index) => {
        const targetClass = sortedClasses[index % numClasses];
        assignments.push({
          studentId: student.id,
          classId: targetClass.id,
          departmentId: deptId
        });

        // Temporarily increment the count for further balancing in memory (though our simple mod loop handles it mostly well)
        targetClass._count.students++;
        totalAssigned++;
      });
    }

    // 5. Execute transaction to update all students
    if (assignments.length > 0) {
      await prisma.$transaction(
        assignments.map((assignment) =>
          prisma.student.update({
            where: { id: assignment.studentId },
            data: {
              classId: assignment.classId,
              departmentId: assignment.departmentId,
            },
          })
        )
      );
    }

    let message = `Successfully assigned ${totalAssigned} students.`;
    if (missingClassesDepts.length > 0) {
      message += ` However, some students were not assigned because the following departments have no classes defined: ${missingClassesDepts.join(', ')}.`;
    }

    res.json({
      success: true,
      message,
      assignedCount: totalAssigned,
      totalUnassigned: unassignedStudents.length,
    });

  } catch (error) {
    console.error("Error auto-assigning batch:", error);
    res.status(500).json({
      success: false,
      error: "Failed to auto-assign batch",
    });
  }
};

export const submitAdmissionForm = async (req: Request, res: Response) => {
  try {
    const formData = req.body;

    // Find the OPEN admission window for this program to associate the correct batch
    const windows = await prisma.admissionWindow.findMany({
      where: {
        program: formData.program as Program,
        isOpen: true,
      },
      include: {
        batch: true,
      },
    });

    const now = new Date();
    const startOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(0, 0, 0, 0);
      return nd;
    };
    const endOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(23, 59, 59, 999);
      return nd;
    };

    const activeWindow = windows.find((window) => {
      const start = startOfDay(new Date(window.startDate));
      const end = endOfDay(new Date(window.endDate));
      return now >= start && now <= end;
    });

    if (!activeWindow || !activeWindow.batch) {
      return res.status(400).json({
        success: false,
        error: "No active admission window found for this program.",
      });
    }

    // Use the batch linked to the active window
    const activeBatch = activeWindow.batch;

    // Generate admission number
    const year = new Date().getFullYear();
    const count = await prisma.student.count({
      where: { program: formData.program },
    });
    const admissionNumber = `${formData.program.toUpperCase()}-${year}-${String(
      count + 1,
    ).padStart(3, "0")}`;

    console.log("Received form data:", formData);

    const newStudent = await prisma.student.create({
      data: {
        // Personal Info
        name: formData.name,
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth)
          : new Date(),
        gender: formData.gender,
        email: formData.email,
        student_phone_number: formData.phone,
        aadhaar_number: formData.aadhaar,
        blood_group: formData.bloodGroup || null,
        religion: formData.religion || "Not Specified",
        caste: formData.caste || null, // Added caste
        nationality: formData.nationality || "Indian",
        mother_tongue: formData.motherTongue || "Not Specified",

        // Parent Info
        fatherName: formData.fatherName || null,
        father_occupation: formData.fatherOccupation || null, // Added
        father_phone_number: formData.fatherPhone || null,
        motherName: formData.motherName || null,
        mother_occupation: formData.motherOccupation || null, // Added
        mother_phone_number: formData.motherPhone || null,
        parent_email: formData.parentEmail || null,
        annual_family_income: formData.annualFamilyIncome || null,
        guardian_name: formData.guardianName || null,
        guardian_relationship: formData.guardianRelationship || null,
        guardian_email: formData.guardianEmail || null,

        // Address Info
        permanent_address: formData.permanentAddress,
        permanent_pincode: formData.permanentPincode || null,
        contact_address: formData.contactAddress || formData.permanentAddress,
        contact_pincode: formData.contactPincode || null,
        state_of_residence:
          formData.stateOfResidence || formData.permanentAddressState,
        local_guardian_address: formData.localGuardianAddress || null,
        local_guardian_phone_number: formData.localGuardianPhone || null,

        // Education Info
        last_institution: formData.qualifyingSchool || "Not Specified",
        qualifying_exam_name: formData.qualifyingExam || formData.bachelorDegree || "Not Specified",
        qualifying_exam_register_no: formData.qualifyingExamRegisterNo || null,
        physics_score: formData.physicsScore
          ? parseFloat(formData.physicsScore)
          : null,
        chemistry_score: formData.chemistryScore
          ? parseFloat(formData.chemistryScore)
          : null,
        maths_score: formData.mathsScore
          ? parseFloat(formData.mathsScore)
          : null,
        percentage: formData.totalPercentage
          ? parseFloat(formData.totalPercentage)
          : null,
        previous_degree_cgpa_or_total_marks: formData.previousDegreeCGPA
          ? parseFloat(formData.previousDegreeCGPA)
          : null,
        tc_number: formData.tcNumber || null,
        tc_date: formData.tcDate ? new Date(formData.tcDate) : null,
        tc_issued_by: formData.tcIssuedBy || null, // Added tc_issued_by

        // Entrance Info
        entrance_type: formData.entranceExamType || null,
        entrance_roll_no: formData.entranceExamRollNumber || null,
        entrance_rank: formData.entranceRank
          ? parseInt(formData.entranceRank)
          : null,
        entrance_total_score: formData.entranceExamScore
          ? parseFloat(formData.entranceExamScore)
          : null,
        keam_subject_total: formData.keamSubjectTotal
          ? parseFloat(formData.keamSubjectTotal)
          : null,

        // Bank Info
        account_number: formData.bankAccountNumber || null,
        bank_name: formData.bankName || null,
        ifsc_code: formData.bankIFSCCode || null,
        bank_branch: formData.bankBranch || null,

        // Additional Info
        category: formData.category || "General",
        admitted_category: formData.admittedCategory || formData.category,

        // System fields
        program: formData.program,
        admission_type:
          formData.admissionType === "nri"
            ? "NRI"
            : formData.admissionType || "regular",
        admission_number: admissionNumber,
        admission_date: new Date(),
        status: StudentStatus.pending,
        password: "changeme123", // Default password
        allotted_branch: formData.allottedBranch || "Not Assigned",
        // Preferred department is stored for reference during class assignment
        preferredDepartmentId: formData.preferredDepartment
          ? parseInt(formData.preferredDepartment)
          : null,
        // Department will be assigned by admin after approval - use a placeholder department
        // The student's departmentId will be properly assigned when admin assigns them to a class
        departmentId: formData.departmentId
          ? parseInt(formData.departmentId)
          : null,
        classId: null, // Class will be assigned by admin after approval
      },
      include: {
        department: true,
      },
    });


    // Send confirmation email (fire and forget)
    if (newStudent.email) {
      sendAdmissionConfirmation(
        newStudent.email,
        newStudent.name,
        admissionNumber
      ).catch((err: any) => console.error("Failed to send confirmation email:", err));
    }

    res.status(201).json({
      success: true,
      studentId: newStudent.id,
      admissionNumber,
      message: `Your admission form has been submitted successfully. Your admission number is ${admissionNumber}`,
      formUrl: `/admission/${admissionNumber}`,
    });
  } catch (error: any) {
    console.error("Error submitting admission form:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "A student with this email or Aadhaar already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to submit admission form",
      details: error.message || String(error),
    });
  }
};

// Get admission by admission number
export const getAdmissionByNumber = async (req: Request, res: Response) => {
  try {
    const { admissionNumber } = req.params;

    const student = await prisma.student.findUnique({
      where: { admission_number: admissionNumber },
      include: {
        department: true,
      },
    });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Admission not found" });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    console.error("Error fetching admission:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch admission" });
  }
};

// Bulk update admissions (approve/reject multiple)
export const bulkUpdateStatus = async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid student IDs" });
    }

    if (!Object.values(StudentStatus).includes(status)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid status value" });
    }

    // If status is approved, we need to process individually to generate sequential admission numbers
    if (status === StudentStatus.approved) {
      const results = [];
      const errors = [];

      for (const id of ids) {
        try {
          const studentId = parseInt(id);
          const student = await prisma.student.findUnique({ where: { id: studentId } });

          if (!student) {
            errors.push(`Student ID ${id} not found`);
            continue;
          }

          const deptId = student.departmentId || student.preferredDepartmentId;
          if (!deptId) {
            errors.push(`Student ID ${id} ( ${student.name} ) has no department assigned`);
            continue;
          }

          // Generate number
          const admissionNumber = await generateAdmissionNumber(deptId);

          // Update
          const updated = await prisma.student.update({
            where: { id: studentId },
            data: {
              status: StudentStatus.approved,
              admission_number: admissionNumber,
              departmentId: !student.departmentId ? deptId : undefined, // Assign dept if needed
              updatedAt: new Date()
            }
          });
          results.push(updated);

        } catch (err: any) {
          console.error(`Error approving student ${id}:`, err);
          errors.push(`Failed to approve student ${id}: ${err.message}`);
        }
      }

      if (errors.length > 0 && results.length === 0) {
        return res.status(400).json({ success: false, error: "Failed to approve students", details: errors });
      }

      return res.json({
        success: true,
        message: `${results.length} applications approved successfully. ${errors.length > 0 ? `${errors.length} failed.` : ''}`,
        errors: errors.length > 0 ? errors : undefined
      });

    } else {
      // Normal bulk update for other statuses
      await prisma.student.updateMany({
        where: {
          id: { in: ids.map((id: any) => parseInt(id)) },
        },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: `${ids.length} applications updated successfully`,
      });
    }

  } catch (error) {
    console.error("Error bulk updating status:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update applications" });
  }
};

// Get approved students ready for class assignment
export const getApprovedStudentsForAssignment = async (
  req: Request,
  res: Response,
) => {
  try {
    const { program, page, limit, preferredDepartmentId } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: StudentStatus.approved,
      classId: null, // Only students not yet assigned to a class
    };

    if (program && program !== "all") {
      where.program = program;
    }

    if (preferredDepartmentId && preferredDepartmentId !== "all") {
      where.preferredDepartmentId = parseInt(preferredDepartmentId as string);
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          name: true,
          email: true,
          program: true,
          admission_number: true,
          entrance_rank: true,
          admission_type: true,
          category: true,
          allotted_branch: true,
          preferredDepartmentId: true,
          preferredDepartment: {
            select: {
              id: true,
              name: true,
              department_code: true,
            },
          },
        },
        orderBy: [{ entrance_rank: "asc" }, { name: "asc" }],
      }),
      prisma.student.count({ where }),
    ]);

    res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching approved students:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch approved students",
    });
  }
};

// Get available classes for a specific batch
export const getClassesForBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id: parseInt(batchId) },
      include: {
        batchDepartments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                department_code: true,
              },
            },
            classes: {
              include: {
                _count: {
                  select: { students: true },
                },
              },
            },
          },
        },
        admissionWindow: {
          select: {
            program: true,
          },
        },
      },
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: "Batch not found",
      });
    }

    res.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    console.error("Error fetching classes for batch:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch classes",
    });
  }
};

// Get batches with UPCOMING status (for class assignment)
export const getUpcomingBatches = async (req: Request, res: Response) => {
  try {
    const batches = await prisma.batch.findMany({
      where: {
        status: { in: ["UPCOMING", "ACTIVE"] },
      },
      include: {
        batchDepartments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                department_code: true,
              },
            },
            classes: {
              include: {
                _count: {
                  select: { students: true },
                },
              },
            },
          },
        },
        admissionWindow: {
          select: {
            program: true,
          },
        },
      },
      orderBy: {
        startYear: "desc",
      },
    });

    res.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error("Error fetching upcoming batches:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch batches",
    });
  }
};

// Assign a single student to a class
export const assignStudentToClass = async (req: Request, res: Response) => {
  try {
    const { studentId, classId } = req.body;

    if (!studentId || !classId) {
      return res.status(400).json({
        success: false,
        error: "Student ID and Class ID are required",
      });
    }

    // Get the class with its department info
    const classInfo = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
      include: {
        batchDepartment: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        error: "Class not found",
      });
    }

    // Update the student
    const updatedStudent = await prisma.student.update({
      where: { id: parseInt(studentId) },
      data: {
        classId: parseInt(classId),
        departmentId: classInfo.batchDepartment.departmentId,
      },
      include: {
        class: true,
        department: true,
      },
    });

    res.json({
      success: true,
      message: `Student assigned to ${classInfo.name} successfully`,
      data: updatedStudent,
    });
  } catch (error: any) {
    console.error("Error assigning student to class:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to assign student to class",
    });
  }
};

// Bulk assign students to classes (auto-distribute)
export const autoAssignStudentsToClasses = async (
  req: Request,
  res: Response,
) => {
  try {
    const { studentIds, batchDepartmentId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Student IDs array is required",
      });
    }

    if (!batchDepartmentId) {
      return res.status(400).json({
        success: false,
        error: "Batch Department ID is required",
      });
    }

    // Get the classes for this batch department
    const batchDepartment = await prisma.batchDepartment.findUnique({
      where: { id: parseInt(batchDepartmentId) },
      include: {
        department: true,
        classes: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    if (!batchDepartment) {
      return res.status(404).json({
        success: false,
        error: "Batch department not found",
      });
    }

    if (batchDepartment.classes.length === 0) {
      return res.status(400).json({
        success: false,
        error: `No classes found for department ${batchDepartment.department.name}. Please create classes first in the Manage Classes section.`,
      });
    }

    // Sort classes by current student count (ascending) for balanced distribution
    const sortedClasses = batchDepartment.classes.sort(
      (a, b) => a._count.students - b._count.students,
    );

    // Distribute students evenly across classes
    const assignments: { studentId: number; classId: number }[] = [];
    let classIndex = 0;
    const numClasses = sortedClasses.length;

    for (const studentId of studentIds) {
      const targetClass = sortedClasses[classIndex % numClasses];
      assignments.push({
        studentId: parseInt(studentId),
        classId: targetClass.id,
      });
      classIndex++;
    }

    // Perform the assignments in a transaction
    await prisma.$transaction(
      assignments.map((assignment) =>
        prisma.student.update({
          where: { id: assignment.studentId },
          data: {
            classId: assignment.classId,
            departmentId: batchDepartment.departmentId,
          },
        }),
      ),
    );

    res.json({
      success: true,
      message: `${studentIds.length} students assigned to ${batchDepartment.department.name} classes successfully`,
      assignedCount: studentIds.length,
    });
  } catch (error) {
    console.error("Error auto-assigning students:", error);
    res.status(500).json({
      success: false,
      error: "Failed to auto-assign students to classes",
    });
  }
};

// Bulk assign students to a specific class
export const bulkAssignToClass = async (req: Request, res: Response) => {
  try {
    const { studentIds, classId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Student IDs array is required",
      });
    }

    if (!classId) {
      return res.status(400).json({
        success: false,
        error: "Class ID is required",
      });
    }

    // Get the class with its department info
    const classInfo = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
      include: {
        batchDepartment: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        error: "Class not found",
      });
    }

    // Update all students
    await prisma.student.updateMany({
      where: {
        id: { in: studentIds.map((id: any) => parseInt(id)) },
      },
      data: {
        classId: parseInt(classId),
        departmentId: classInfo.batchDepartment.departmentId,
      },
    });

    res.json({
      success: true,
      message: `${studentIds.length} students assigned to ${classInfo.name} successfully`,
    });
  } catch (error) {
    console.error("Error bulk assigning students:", error);
    res.status(500).json({
      success: false,
      error: "Failed to assign students to class",
    });
  }
};

// Manually delete stale (pending/rejected/waitlisted) admissions
export const deleteStaleAdmissions = async (req: Request, res: Response) => {
  try {
    const result = await prisma.student.deleteMany({
      where: {
        status: {
          in: [
            StudentStatus.rejected,
            StudentStatus.pending,
            StudentStatus.waitlisted,
          ],
        },
      },
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.count} stale student applications.`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error manually deleting stale admissions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete stale admissions manually",
    });
  }
};
