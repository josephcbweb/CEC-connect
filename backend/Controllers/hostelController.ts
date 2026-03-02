import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';


export const createHostel = async (req: Request, res: Response) => {
  try {
    const { name, wardenName, wardenPhone, monthlyRent } = req.body;

    const hostel = await prisma.hostel.create({
      data: {
        name,
        wardenName,
        wardenPhone,
        monthlyRent: monthlyRent ? Number(monthlyRent) : 0 // Ensure it's a number
      },
    });

    return res.status(201).json({
      success: true,
      message: "Hostel created with rent configuration",
      data: hostel
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};


export const assignStudentToHostel = async (req: Request, res: Response) => {
  try {
    const { studentId, hostelId } = req.body;

    if (!studentId || !hostelId) {
      return res.status(400).json({ success: false, message: "Student ID and Hostel ID are required." });
    }

    // Increased timeout settings to prevent P2028 errors
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the Student record
      const student = await tx.student.update({
        where: { id: Number(studentId) },
        data: {
          hostelId: Number(hostelId),
          hostel_service: true
        },
      });

      // 2. Create the HostelHistory record
      const history = await tx.hostelHistory.create({
        data: {
          studentId: Number(studentId),
          hostelId: Number(hostelId),
          checkInDate: new Date(),
          status: "ACTIVE",
        },
      });

      return { student, history };
    }, {
      maxWait: 10000, // 10s to wait for a connection
      timeout: 20000  // 20s for the transaction to complete
    });

    return res.status(200).json({
      success: true,
      message: "Student successfully assigned to hostel.",
      data: result
    });
  } catch (error: any) {
    console.error("Assignment Error:", error);

    // Check for specific Prisma errors
    if (error.code === 'P2028') {
      return res.status(504).json({ success: false, error: "Database transaction timed out. Please try again." });
    }

    return res.status(400).json({
      success: false,
      error: "Failed to assign student. Ensure the student and hostel exist."
    });
  }
};


export const getHostelStudents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hostelData = await prisma.hostel.findUnique({
      where: { id: Number(id) },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            student_phone_number: true,
            currentSemester: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!hostelData) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    // Flattening the class name for a cleaner API response
    const formattedStudents = hostelData.students.map(student => ({
      id: student.id,
      name: student.name,
      phone: student.student_phone_number,
      semester: student.currentSemester,
      className: student.class?.name || "Not Assigned",
    }));

    return res.status(200).json({
      success: true,
      hostelName: hostelData.name,
      warden: hostelData.wardenName,
      wardenPhone: hostelData.wardenPhone, // Add this
      monthlyRent: hostelData.monthlyRent, // Add this
      students: formattedStudents
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllHostels = async (req: Request, res: Response) => {
  try {
    const hostels = await prisma.hostel.findMany({
      select: {
        id: true,
        name: true,
        wardenName: true,
        wardenPhone: true,
        monthlyRent: true, // ADD THIS LINE
        _count: { select: { students: true } },
      },
    });
    return res.status(200).json({ success: true, data: hostels });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Update Warden Name and Phone
export const updateWarden = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { wardenName, wardenPhone } = req.body;

    await prisma.hostel.update({
      where: { id: Number(id) },
      data: { wardenName, wardenPhone },
    });

    return res.status(200).json({ success: true, message: "Warden updated successfully" });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Update Monthly Rent
export const updateRent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { monthlyRent } = req.body;

    await prisma.hostel.update({
      where: { id: Number(id) },
      data: { monthlyRent: Number(monthlyRent) },
    });

    return res.status(200).json({ success: true, message: "Rent updated successfully" });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const generateMonthlyInvoices = async (req: Request, res: Response) => {
  try {
    // 1. Destructure month, year, and the new dueDate from the frontend request
    const { month, year, dueDate, studentIds } = req.body;

    if (!dueDate) {
      return res.status(400).json({ success: false, message: "Due date is required." });
    }

    // Convert the incoming date string into a JS Date object
    const finalDueDate = new Date(dueDate);

    // 2. Fetch active hostel residents, optionally filtering by studentIds
    const residents = await prisma.student.findMany({
      where: {
        hostel_service: true,
        status: { not: 'graduated' },
        hostelId: { not: null },
        ...(studentIds && Array.isArray(studentIds) && studentIds.length > 0
          ? { id: { in: studentIds.map(Number) } }
          : {}),
      },
      include: { hostel: true }
    });

    if (residents.length === 0) {
      return res.status(404).json({ success: false, message: "No active residents found to bill matching the criteria." });
    }

    // 3. Duplicate Prevention: Find already billed students for this period
    const feeTypeString = `HOSTEL_RENT_${month.toUpperCase()}_${year}`;

    const existingFees = await prisma.feeDetails.findMany({
      where: {
        feeType: feeTypeString,
        studentId: { in: residents.map(r => r.id) }
      },
      select: { studentId: true }
    });

    const alreadyBilledIds = new Set(existingFees.map(f => f.studentId));

    const studentsToBill = residents.filter(r => !alreadyBilledIds.has(r.id));
    const skippedCount = residents.length - studentsToBill.length;

    if (studentsToBill.length === 0) {
      return res.status(400).json({
        success: false,
        message: `All ${skippedCount} selected resident(s) have already been billed for ${month} ${year}.`
      });
    }

    // 4. Transaction: Create FeeDetail and Invoice for each resident
    const result = await prisma.$transaction(
      studentsToBill.map((student) => {
        return prisma.feeDetails.create({
          data: {
            studentId: student.id,
            feeType: feeTypeString,
            amount: student.hostel?.monthlyRent || 0,
            dueDate: finalDueDate, // Using the date provided by admin
            semester: student.currentSemester,
            invoices: {
              create: {
                studentId: student.id,
                amount: student.hostel?.monthlyRent || 0,
                dueDate: finalDueDate, // Using the date provided by admin
                status: 'unpaid',
                feeStructureId: 4,
                semester: student.currentSemester
              }
            }
          }
        });
      })
    );

    return res.status(201).json({
      success: true,
      message: `Successfully generated ${result.length} invoices for ${month} ${year}. ${skippedCount > 0 ? `(${skippedCount} skipped due to existing bills)` : ''}`,
      generatedCount: result.length,
      skippedCount
    });
  } catch (error: any) {
    console.error("Invoicing Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const vacateStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    // 1. Fetch all unpaid/overdue hostel invoices for this student
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        studentId: Number(studentId),
        status: { in: ['unpaid', 'overdue'] },
        // Ensure we only look at hostel rent, not academic fees
        fee: { feeType: { contains: 'HOSTEL_RENT' } }
      }
    });

    // 2. If dues are found, calculate the total and block vacation
    if (pendingInvoices.length > 0) {
      const totalDue = pendingInvoices.reduce((acc, inv) => acc + Number(inv.amount), 0);

      return res.status(400).json({
        success: false,
        message: "Action Blocked: Outstanding dues found.",
        totalDue: totalDue // This is what the frontend modal uses
      });
    }

    // 3. Perform Vacation Transaction (Atomically update Student and History)
    await prisma.$transaction(async (tx) => {
      // Remove hostel association from Student record
      await tx.student.update({
        where: { id: Number(studentId) },
        data: {
          hostelId: null,
          hostel_service: false
        }
      });

      // Mark the active history record as VACATED
      await tx.hostelHistory.updateMany({
        where: {
          studentId: Number(studentId),
          status: 'ACTIVE'
        },
        data: {
          vacatedDate: new Date(),
          status: 'VACATED'
        }
      });
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    return res.status(200).json({
      success: true,
      message: "Student has been vacated successfully."
    });

  } catch (error: any) {
    console.error("Vacate Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getStudentHostelLedger = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const ledger = await prisma.invoice.findMany({
      where: {
        studentId: Number(studentId),
        fee: { feeType: { contains: 'HOSTEL' } }
      },
      include: {
        payments: true,
        fee: { select: { feeType: true, createdAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: ledger });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getHostelFineSettings = async (req: Request, res: Response) => {
  try {
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: 4 }, // Hostel Fee
      include: {
        fineSlabs: {
          orderBy: { startDay: "asc" },
        },
      },
    });

    if (!feeStructure) {
      return res.status(404).json({ error: "Hostel fee structure not found." });
    }

    res.status(200).json(feeStructure);
  } catch (error) {
    console.error("Error fetching hostel fine settings:", error);
    res.status(500).json({ error: "Failed to fetch fine settings." });
  }
};

export const updateHostelFineSettings = async (req: Request, res: Response) => {
  try {
    const { fineEnabled, fineSlabs } = req.body;
    const feeId = 4; // Hostel Fee

    const updatedSettings = await prisma.$transaction(async (tx) => {
      // Update the main structure toggle
      await tx.feeStructure.update({
        where: { id: feeId },
        data: {
          fineEnabled: fineEnabled ?? false,
        },
      });

      // Erase existing slabs and recreate if fine enabled and slabs exist
      await tx.fineSlab.deleteMany({ where: { feeStructureId: feeId } });

      if (fineEnabled && fineSlabs && fineSlabs.length > 0) {
        await tx.fineSlab.createMany({
          data: fineSlabs.map((slab: any) => ({
            feeStructureId: feeId,
            startDay: Number(slab.startDay),
            endDay: slab.endDay ? Number(slab.endDay) : null,
            amountPerDay: parseFloat(slab.amountPerDay),
          })),
        });
      }

      return tx.feeStructure.findUnique({
        where: { id: feeId },
        include: { fineSlabs: { orderBy: { startDay: "asc" } } },
      });
    });

    res.status(200).json({ success: true, data: updatedSettings });
  } catch (error: any) {
    console.error("Error updating hostel fine settings:", error);
    res.status(500).json({ error: "Failed to update fine settings." });
  }
};