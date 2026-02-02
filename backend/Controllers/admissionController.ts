import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  StudentStatus,
  AdmissionType,
  Program,
  RequestStatus,
} from "../generated/prisma/enums";

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
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (program && program !== "all") {
      where.program = program;
    }

    if (admissionType && admissionType !== "all") {
      where.admission_type = admissionType;
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
    const [total, pending, approved, rejected, waitlisted] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: StudentStatus.pending } }),
      prisma.student.count({ where: { status: StudentStatus.approved } }),
      prisma.student.count({ where: { status: StudentStatus.rejected } }),
      prisma.student.count({ where: { status: StudentStatus.waitlisted } }),
    ]);

    // Program-wise stats
    const btechCount = await prisma.student.count({
      where: { program: Program.btech },
    });
    const mcaCount = await prisma.student.count({
      where: { program: Program.mca },
    });

    // Admission type stats
    const regularCount = await prisma.student.count({
      where: { admission_type: AdmissionType.regular },
    });
    const lateralCount = await prisma.student.count({
      where: { admission_type: AdmissionType.lateral },
    });
    const nriCount = await prisma.student.count({
      where: { admission_type: AdmissionType.nri },
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
        byProgram: {
          btech: btechCount,
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

    const updatedStudent = await prisma.student.update({
      where: { id: parseInt(id) },
      data: {
        status,
        updatedAt: new Date(),
      },
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

    // 2. Run the transaction with increased timeout settings
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
            isOpen: isOpen ?? false,
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

    // Fetch departments - optionally filter by program if needed
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        department_code: true,
      },
      orderBy: {
        name: "asc",
      },
    });

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

export const submitAdmissionForm = async (req: Request, res: Response) => {
  try {
    const formData = req.body;

    const activeBatch = await prisma.batch.findFirst({
      where: {
        status: "UPCOMING", // Or logic to find the batch linked to the open window
      },
    });

    if (!activeBatch) {
      return res
        .status(400)
        .json({ success: false, error: "No active admission batch found." });
    }

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
        nationality: formData.nationality || "Indian",
        mother_tongue: formData.motherTongue || "Not Specified",

        // Parent Info
        fatherName: formData.fatherName || null,
        father_phone_number: formData.fatherPhone || null,
        motherName: formData.motherName || null,
        mother_phone_number: formData.motherPhone || null,
        parent_email: formData.parentEmail || null,
        annual_family_income: formData.annualFamilyIncome || null,
        guardian_name: formData.guardianName || null,
        guardian_relationship: formData.guardianRelationship || null,
        guardian_email: formData.guardianEmail || null,

        // Address Info
        permanent_address: formData.permanentAddress,
        contact_address: formData.contactAddress || formData.permanentAddress,
        state_of_residence:
          formData.stateOfResidence || formData.permanentAddressState,
        local_guardian_address: formData.localGuardianAddress || null,
        local_guardian_phone_number: formData.localGuardianPhone || null,

        // Education Info
        last_institution: formData.qualifyingExamInstitute || "Not Specified",
        qualifying_exam_name: formData.qualifyingExam,
        qualifying_exam_register_no: formData.qualifyingExamRegisterNo,
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
        admission_quota: formData.admissionQuota || "general",
        admitted_category: formData.admittedCategory || formData.category,

        // System fields
        program: formData.program,
        admission_type: formData.admissionType || "regular",
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
        departmentId: formData.departmentId || null,
        classId: null, // Class will be assigned by admin after approval
      },
      include: {
        department: true,
      },
    });

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

    res
      .status(500)
      .json({ success: false, error: "Failed to submit admission form" });
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
