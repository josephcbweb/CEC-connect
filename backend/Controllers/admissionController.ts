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
    const startOfDay = (d: Date) => { const nd = new Date(d); nd.setHours(0,0,0,0); return nd; };
    const endOfDay = (d: Date) => { const nd = new Date(d); nd.setHours(23,59,59,999); return nd; };
    // Dynamically calculate status for the frontend
    const processedWindows = windows.map(window => {
      const start = startOfDay(new Date(window.startDate));
      const end = endOfDay(new Date(window.endDate));
      return {
        ...window,
        isOpen: window.isOpen && now >= start && now <= end
      };
    });

    res.json({ success: true, data: processedWindows });
  } catch (error) {
    console.error("Error fetching admission windows:", error);
    res.status(500).json({ success: false, error: "Failed to fetch admission windows" });
  }
};

// Update admission window
export const updateAdmissionWindow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isOpen, startDate, endDate, description } = req.body;

    const current = await prisma.admissionWindow.findUnique({ where: { id: parseInt(id) } });
    if (!current) return res.status(404).json({ success: false, error: "Window not found" });

    const newStart = startDate ? new Date(startDate) : current.startDate;
    const newEnd = endDate ? new Date(endDate) : current.endDate;
    const now = new Date();

    // Re-validate isOpen: Must be true only if within date range
    const startOfDay = (d: Date) => { const nd = new Date(d); nd.setHours(0,0,0,0); return nd; };
    const endOfDay = (d: Date) => { const nd = new Date(d); nd.setHours(23,59,59,999); return nd; };
    const ns = startOfDay(newStart);
    const ne = endOfDay(newEnd);
    const validatedIsOpen = isOpen !== undefined 
      ? (isOpen && now >= ns && now <= ne) 
      : (current.isOpen && now >= ns && now <= ne);

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
    res.status(500).json({ success: false, error: "Failed to update admission window" });
  }
};

// Delete admission window
export const deleteAdmissionWindow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Use a transaction with custom timeouts to prevent P2028
    await prisma.$transaction(async (tx) => {
      // 1. Fetch window to get the linked batchId
      const window = await tx.admissionWindow.findUnique({
        where: { id: parseInt(id) },
        select: { batchId: true }
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
    }, {
      maxWait: 10000, // Wait 10s for a connection
      timeout: 20000  // Allow 20s for the work to finish
    });

    res.json({ 
      success: true, 
      message: "Admission finalized: Batch is now ACTIVE and window removed." 
    });
  } catch (error: any) {
    console.error("Error deleting admission window:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to finalize admission" 
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
      departmentIds   
    } = req.body;

    // 1. Basic validation
    if (!batchName || !startYear || !endYear || !departmentIds || !Array.isArray(departmentIds)) {
      return res.status(400).json({
        success: false,
        error: "Batch details and at least one department are required.",
      });
    }

    // 2. Run the transaction with increased timeout settings
    const result = await prisma.$transaction(async (tx) => {
      
      // Check if window already exists for this program
      const existingWindow = await tx.admissionWindow.findFirst({
        where: { program },
      });

      if (existingWindow) {
        // Throwing error inside transaction triggers automatic rollback
        throw new Error(`Admission window for ${program.toUpperCase()} already exists`);
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
    batchId: newBatch.id // Ensure this link is present
  },
});

      return { newBatch, newWindow };
    }, {
      // P2028 FIX: Give the engine more time to acquire a connection and finish
      maxWait: 10000, // default is 2s, increased to 10s
      timeout: 20000, // default is 5s, increased to 20s
    });

    res.status(201).json({
      success: true,
      message: "Admission window opened and Batch initialized successfully",
      data: result,
    });

  } catch (error: any) {
    console.error("Error setting up admission:", error);
    
    // Handle the specific transaction timeout error for better UX
    if (error.code === 'P2028') {
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

    const startOfDay = (d: Date) => { const nd = new Date(d); nd.setHours(0,0,0,0); return nd; };
    const endOfDay = (d: Date) => { const nd = new Date(d); nd.setHours(23,59,59,999); return nd; };

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
export const submitAdmissionForm = async (req: Request, res: Response) => {
  try {
    const formData = req.body;

    const activeBatch = await prisma.batch.findFirst({
      where: {
        status: "UPCOMING", // Or logic to find the batch linked to the open window
      }
    });

    if (!activeBatch) {
      return res.status(400).json({ success: false, error: "No active admission batch found." });
    }

    // Generate admission number
    const year = new Date().getFullYear();
    const count = await prisma.student.count({
      where: { program: formData.program },
    });
    const admissionNumber = `${formData.program.toUpperCase()}-${year}-${String(
      count + 1
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
        is_fee_concession_eligible:
          formData.applyForFeeConcession === true ||
          formData.applyForFeeConcession === "true",
        hostel_service:
          formData.hostelService === true || formData.hostelService === "true",
        bus_service:
          formData.busService === true || formData.busService === "true",
        busRequests:
          (formData.busService === true || formData.busService === "true") &&
          formData.busId &&
          formData.busStopId
            ? {
                create: {
                  busId: parseInt(formData.busId),
                  busStopId: parseInt(formData.busStopId),
                  status: RequestStatus.pending,
                },
              }
            : undefined,

        // System fields
        program: formData.program,
        admission_type: formData.admissionType || "regular",
        admission_number: admissionNumber,
        admission_date: new Date(),
        status: StudentStatus.pending,
        password: "changeme123", // Default password
        allotted_branch: formData.allottedBranch || "Not Assigned",
        departmentId: formData.departmentId || 1, // Default department
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
