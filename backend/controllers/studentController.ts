import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getStudents = async (req: Request, res: Response) => {
  try {
    const result = await prisma.student.findMany({
      where: {
        status: {
          notIn: ["graduated", "deleted"],
        },
      },
      include: {
        department: true,
        invoices: {
          include: {
            FeeStructure: {
              include: { fineSlabs: { orderBy: { startDay: "asc" } } },
            },
          },
        },
        feeDetails: true,
      },
    });
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error fetching students:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch students", details: error.toString() });
  }
};
const calculateYear = (admissionDate: Date | null): number | null => {
  if (!admissionDate) return null;

  const now = new Date();
  const yearsElapsed = now.getFullYear() - admissionDate.getFullYear() + 1;

  // Adjust if current month is before admission month
  const hasCompletedYear =
    now.getMonth() >= admissionDate.getMonth() &&
    now.getDate() >= admissionDate.getDate();

  return hasCompletedYear ? yearsElapsed + 1 : yearsElapsed;
};

export const getStudentFeeDetails = async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.id);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid student ID provided." });
    }

    const studentWithFees = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        department: true,
        invoices: {
          orderBy: {
            dueDate: "asc",
          },
          include: {
            fee: true,
            FeeStructure: {
              include: { fineSlabs: { orderBy: { startDay: "asc" } } },
            },
          },
        },
      },
    });

    if (!studentWithFees) {
      return res.status(404).json({ error: "Student not found." });
    }

    res.status(200).json(studentWithFees);
  } catch (error) {
    console.error(
      `Error fetching fee details for student ID ${req.params.id}:`,
      error,
    );
    res.status(500).json({ error: "Failed to retrieve fee details." });
  }
};

export const getStudentProfile = async (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id);
  if (isNaN(studentId)) {
    return res.status(400).json({ error: "Invalid student ID" });
  }
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        department: true, //to get department name
        bus: true,
        busStop: true,
      },
    });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    // Fetch pending or approved bus request (most recent first)
    const pendingBusRequest = await prisma.busRequest.findFirst({
      where: {
        studentId: student.id,
        status: { in: ["pending", "approved"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        bus: true,
        busStop: true,
      },
    });

    // Compute hasOverdueBusFee: true if any unpaid invoice with "Bus Fee" in its feeType exists AND the dueDate has passed
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const overdueBusFeeInvoice = await prisma.invoice.findFirst({
      where: {
        studentId: student.id,
        fee: { feeType: { contains: "Bus Fee" } },
        OR: [
          { status: "overdue" },
          {
            status: "unpaid",
            dueDate: {
              lt: today,
            },
          },
        ],
      },
    });
    const hasOverdueBusFee = !!overdueBusFeeInvoice;

    console.log(student);
    const formattedStudent = {
      id: student.id,
      name: student.name,
      email: student.email,
      dateOfBirth: student.dateOfBirth,
      program: student.program,
      department: student.department?.name || "Not Assigned",
      year: calculateYear(student.admission_date),

      gender: student.gender,
      bloodGroup: student.blood_group,
      phone: student.student_phone_number,
      permanentAddress: student.permanent_address,
      contactAddress: student.contact_address,
      aadhaarNumber: student.aadhaar_number,

      fatherName: student.fatherName,
      fatherPhone: student.father_phone_number,
      motherName: student.motherName,
      motherPhone: student.mother_phone_number,
      parentEmail: student.parent_email,
      guardianName: student.guardian_name,
      guardianAddress: student.local_guardian_address,
      guardianPhone: student.local_guardian_phone_number,

      admittedCategory: student.admitted_category,

      physics: student.physics_score,
      chemistry: student.chemistry_score,
      maths: student.maths_score,
      keamTotal: student.keam_subject_total,
      entranceTotal: student.entrance_total_score,
      previousPercentage: student.previous_degree_cgpa_or_total_marks,
      previousInstitution: student.last_institution,

      accountNumber: student.account_number,
      bankName: student.bank_name,
      bankBranch: student.bank_branch,

      // Bus Service Info
      bus_service: student.bus_service,
      busDetails: student.bus
        ? {
            busName: student.bus.busName,
            busNumber: student.bus.busNumber,
            stopName: student.busStop?.stopName,
            feeAmount: student.busStop?.feeAmount,
          }
        : null,
      pendingBusRequest: pendingBusRequest
        ? {
            id: pendingBusRequest.id,
            busName: pendingBusRequest.bus.busName,
            stopName: pendingBusRequest.busStop.stopName,
            feeAmount: pendingBusRequest.busStop.feeAmount,
            status: pendingBusRequest.status,
          }
        : null,
      hasOverdueBusFee,
      is_bus_pass_suspended: student.is_bus_pass_suspended,
      bus_pass_suspended_until: student.bus_pass_suspended_until,
    };
    console.log(formattedStudent);
    return res.status(200).json(formattedStudent);
  } catch (error) {
    console.log(`Error fetching student details:`, error);
    return res.status(500).json({ error: `Failed to fetch student details` });
  }
};

export const updateStudentProfile = async (req: Request, res: Response) => {
  try {
    const studentId = Number(req.params.id);
    console.log("Hello");
    console.log("BODY:", req.body);
    if (isNaN(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const {
      email,
      phone,
      permanentAddress,
      contactAddress,
      fatherPhone,
      motherPhone,
      guardianAddress,
      accountNumber,
      bankName,
      bankBranch,
    } = req.body;

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        email: email || undefined,
        student_phone_number: phone || undefined,
        permanent_address: permanentAddress || undefined,
        contact_address: contactAddress || undefined,
        father_phone_number: fatherPhone || undefined,
        mother_phone_number: motherPhone || undefined,
        local_guardian_address: guardianAddress || undefined,
        account_number: accountNumber || undefined,
        bank_name: bankName || undefined,
        bank_branch: bankBranch || undefined,
      },
    });

    res.json({
      message: "Profile updated successfully",
      student: updatedStudent,
    });
  } catch (error: any) {
    console.error(error);

    // Prisma unique constraint (email / phone / account number)
    if (error.code === "P2002") {
      return res.status(409).json({
        message: `Duplicate value for field: ${error.meta?.target}`,
      });
    }

    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

export const getAllBusRoutes = async (req: Request, res: Response) => {
  try {
    const routes = await prisma.bus.findMany({
      where: { isActive: true },
      include: {
        stops: {
          select: {
            id: true,
            stopName: true,
            feeAmount: true,
          },
        },
      },
    });
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bus routes" });
  }
};

export const requestBusService = async (req: Request, res: Response) => {
  try {
    const { studentId, busId, busStopId } = req.body;

    if (!studentId || !busId || !busStopId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if request already exists
    const existingRequest = await prisma.busRequest.findFirst({
      where: {
        studentId: Number(studentId),
        status: "pending",
      },
    });

    if (existingRequest) {
      return res
        .status(409)
        .json({ message: "You already have a pending request." });
    }

    const request = await prisma.busRequest.create({
      data: {
        studentId: Number(studentId),
        busId: Number(busId),
        busStopId: Number(busStopId),
        status: "pending",
      },
    });

    res
      .status(201)
      .json({ message: "Bus service requested successfully", request });
  } catch (error) {
    console.error("Error requesting bus service:", error);
    res.status(500).json({ message: "Failed to request bus service" });
  }
};
