import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
// import { RequestStatus } from "@prisma/client";

const BUS_FEE_KEY = "BUS_FEE_ENABLED";

export const fetchBus = async (req: Request, res: Response) => {
  try {
    const buses = await prisma.bus.findMany({
      orderBy: {
        busNumber: "asc",
      },
    });
    return res.status(200).json({
      count: buses.length,
      buses,
    });
  } catch (error) {
    console.error("Error fetching buses:", error);

    return res.status(500).json({
      message: "Failed to fetch bus list",
    });
  }
};

export const addBus = async (req: Request, res: Response) => {
  console.log("Add Bus API hit");

  try {
    const {
      busNumber,
      busName,
      routeName,
      totalSeats,
      driverName,
      driverPhone,
      registrationNo,
    } = req.body;

    // 🔹 Basic validation
    if (!busNumber || !totalSeats || !driverName || !driverPhone) {
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }

    if (totalSeats <= 0) {
      return res.status(400).json({
        message: "Total seats must be greater than 0",
      });
    }

    // 🔹 Check for duplicate bus number
    const existingBus = await prisma.bus.findUnique({
      where: { busNumber },
    });

    if (existingBus) {
      return res.status(409).json({
        message: "Bus with this bus number already exists",
      });
    }

    // 🔹 Create bus
    const bus = await prisma.bus.create({
      data: {
        busNumber,
        busName,
        routeName,
        totalSeats: Number(totalSeats),
        driverName,
        driverPhone,
        registrationNo,
      },
    });

    return res.status(201).json(bus);
  } catch (error) {
    console.error("Error adding bus:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getBusDetails = async (req: Request, res: Response) => {
  try {
    const busId = Number(req.params.busId);

    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        stops: {
          select: {
            id: true,
            stopName: true,
            feeAmount: true,
          },
        },
        students: {
          where: {
            bus_service: true,
          },
          include: {
            department: {
              select: { name: true },
            },
            busStop: {
              // ✅ THIS WAS MISSING
              select: {
                id: true,
                stopName: true,
                feeAmount: true,
              },
            },
          },
        },
      },
    });

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    /* ---------------- FORMAT RESPONSE ---------------- */

    const formattedStudents = bus.students.map((student) => ({
      id: student.id,
      name: student.name,
      student_phone_number: student.student_phone_number,
      department: student.department,
      stopName: student.busStop?.stopName || "Not Assigned",
      stopFee: student.busStop?.feeAmount || 0,
    }));

    res.status(200).json({
      busId: bus.id,
      busName: bus.busName,
      busNumber: bus.busNumber,
      capacity: bus.totalSeats,
      numberOfStudents: formattedStudents.length,
      registrationNumber: bus.registrationNo,
      driverName: bus.driverName,
      driverPhone: bus.driverPhone,
      status: bus.isActive ? "Active" : "Inactive",
      stops: bus.stops,
      students: formattedStudents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addBusStops = async (req: Request, res: Response) => {
  try {
    const { busId, stops } = req.body;

    if (!busId || !Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({
        success: false,
        message: "busId and stops array are required",
      });
    }

    const formattedStops = stops.map((stop) => ({
      busId: Number(busId),
      stopName: stop.stopName.trim(),
      feeAmount: Number(stop.feeAmount),
    }));

    const result = await prisma.busStop.createMany({
      data: formattedStops,
      skipDuplicates: true,
    });

    res.status(201).json({
      success: true,
      message: "Bus stops added successfully",
      insertedCount: result.count,
    });
  } catch (error) {
    console.error("Error adding bus stops:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    res.status(500).json({
      success: false,
      message: "Failed to add bus stops",
      error: message,
    });
  }
};

export const deleteBusStop = async (req: Request, res: Response) => {
  try {
    const stopId = Number(req.params.id);

    if (isNaN(stopId)) {
      return res.status(400).json({
        message: "Invalid stop ID",
      });
    }

    // 🔍 Check if stop exists
    const existingStop = await prisma.busStop.findUnique({
      where: { id: stopId },
    });

    if (!existingStop) {
      return res.status(404).json({
        message: "Bus stop not found",
      });
    }

    // 🗑 Delete stop
    await prisma.busStop.delete({
      where: { id: stopId },
    });

    return res.status(200).json({
      success: true,
      message: "Bus stop deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting bus stop:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return res.status(500).json({
      success: false,
      message: "Failed to delete bus stop",
      error: message,
    });
  }
};

export const fetchBusStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      where: {
        bus_service: true,
        busId: {
          not: null,
        },
      },
      select: {
        id: true, // Added ID to select block
        name: true,
        currentSemester: true,
        student_phone_number: true,
        bus: {
          select: {
            busName: true,
          },
        },
        department: {
          select: {
            department_code: true,
          },
        },
      },
    });

    // Converting students to a single level object
    const modifiedStudent = students.map((s) => ({
      id: s.id, // Included ID here
      name: s.name,
      semester: s.currentSemester,
      phoneNumber: s.student_phone_number,
      busName: s.bus?.busName ?? "No Bus Assigned",
      departmentCode: s.department?.department_code || "N/A",
    }));

    return res.status(200).json(modifiedStudent);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch students" });
  }
};

// ─── Helper: Identify unique batches from bus-service students for a given semester ───
async function identifyBatchesForSemester(semester: number, tx?: any) {
  const db = tx || prisma;
  const students = await db.student.findMany({
    where: {
      bus_service: true,
      currentSemester: semester,
      classId: { not: null },
      busStopId: { not: null },
    },
    select: {
      id: true,
      class: {
        select: {
          batchDepartment: {
            select: {
              batch: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  // Extract unique batch IDs and names
  const batchMap = new Map<number, string>();
  for (const s of students) {
    const batch = s.class?.batchDepartment?.batch;
    if (batch && !batchMap.has(batch.id)) {
      batchMap.set(batch.id, batch.name);
    }
  }

  return Array.from(batchMap.entries()).map(([id, name]) => ({ id, name }));
}

// ─── 1. GET /active-semesters ───
export const getActiveBusSemesters = async (req: Request, res: Response) => {
  try {
    const semesters = await prisma.student.groupBy({
      by: ["currentSemester"],
      where: { bus_service: true },
      orderBy: { currentSemester: "asc" },
    });
    res.json(semesters.map((s) => s.currentSemester));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch active semesters" });
  }
};

// ─── 2. GET /preview-bulk-fees?semester=X ───
// Returns student-level counts: eligible, alreadyBilled, netNew + batch breakdown
export const previewBulkBusFees = async (req: Request, res: Response) => {
  const semester = parseInt(req.query.semester as string);
  if (isNaN(semester)) {
    return res.status(400).json({ error: "Valid semester is required" });
  }

  try {
    // 1. All eligible bus-service students for this semester
    const allEligible = await prisma.student.findMany({
      where: {
        bus_service: true,
        currentSemester: semester,
        busStopId: { not: null },
        classId: { not: null },
      },
      select: { id: true },
    });

    const eligibleIds = allEligible.map((s) => s.id);

    // 2. Student-level check: who already has a "Bus Fee" record for this semester?
    const alreadyBilledRecords = await prisma.feeDetails.findMany({
      where: {
        studentId: { in: eligibleIds },
        semester,
        feeType: { contains: "Bus Fee" },
        archived: false,
      },
      select: { studentId: true },
      distinct: ["studentId"],
    });
    const alreadyBilledIds = new Set(alreadyBilledRecords.map((r) => r.studentId));

    const eligible = eligibleIds.length;
    const alreadyBilled = alreadyBilledIds.size;
    const netNew = eligible - alreadyBilled;

    // 3. Batch breakdown for display
    const batches = await identifyBatchesForSemester(semester);
    const batchDetails = [];

    for (const batch of batches) {
      const batchStudents = await prisma.student.findMany({
        where: {
          bus_service: true,
          currentSemester: semester,
          busStopId: { not: null },
          class: { batchDepartment: { batchId: batch.id } },
        },
        select: { id: true },
      });

      const totalInBatch = batchStudents.length;
      const billedInBatch = batchStudents.filter((s) => alreadyBilledIds.has(s.id)).length;

      batchDetails.push({
        batchId: batch.id,
        batchName: batch.name,
        total: totalInBatch,
        alreadyBilled: billedInBatch,
        netNew: totalInBatch - billedInBatch,
      });
    }

    res.json({ eligible, alreadyBilled, netNew, batches: batchDetails });
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).json({ error: "Failed to generate preview" });
  }
};

// ─── 3. POST /assign-bulk-fees ───
// Student-level dedup: skips individual students who already have a Bus Fee for this semester
export const assignBulkBusFees = async (req: Request, res: Response) => {
  const { semester, dueDate } = req.body;
  const targetSemester = parseInt(semester);

  if (isNaN(targetSemester) || !dueDate) {
    return res.status(400).json({ error: "semester and dueDate are required" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Identify batches
      const batches = await identifyBatchesForSemester(targetSemester, tx);

      if (batches.length === 0) {
        throw new Error("No batches found with bus-service students for this semester.");
      }

      // 2. Get ALL eligible students across all batches
      const allStudents = await tx.student.findMany({
        where: {
          bus_service: true,
          currentSemester: targetSemester,
          busStopId: { not: null },
          classId: { not: null },
        },
        select: { id: true },
      });

      // 3. Student-level double-bill check
      const existingFees = await tx.feeDetails.findMany({
        where: {
          studentId: { in: allStudents.map((s) => s.id) },
          semester: targetSemester,
          feeType: { contains: "Bus Fee" },
          archived: false,
        },
        select: { studentId: true },
        distinct: ["studentId"],
      });
      const alreadyBilledIds = new Set(existingFees.map((f: any) => f.studentId));

      let totalStudentsBilled = 0;
      let totalSkipped = 0;
      const processedBatchNames: string[] = [];
      const feeName = `Bus Fee - Sem ${targetSemester}`;
      const dueDateObj = new Date(dueDate);

      // 4. Process each batch
      for (const batch of batches) {
        // 4a. Upsert BusFeeAssignment (idempotent master record)
        const assignment = await tx.busFeeAssignment.upsert({
          where: {
            batchId_semester: {
              batchId: batch.id,
              semester: targetSemester,
            },
          },
          update: {}, // No-op if already exists
          create: {
            batchId: batch.id,
            semester: targetSemester,
            dueDate: dueDateObj,
          },
        });

        // 4b. Fetch students for this batch + semester
        const students = await tx.student.findMany({
          where: {
            bus_service: true,
            currentSemester: targetSemester,
            busStopId: { not: null },
            class: { batchDepartment: { batchId: batch.id } },
          },
          include: { busStop: true },
        });

        // 4c. Create FeeDetails + Invoice only for non-billed students
        let batchBilled = 0;
        for (const student of students) {
          if (alreadyBilledIds.has(student.id)) {
            totalSkipped++;
            continue; // Student-level skip
          }

          const amount = student.busStop?.feeAmount || 0;

          await tx.feeDetails.create({
            data: {
              studentId: student.id,
              feeType: feeName,
              amount,
              dueDate: dueDateObj,
              semester: targetSemester,
              archived: false,
              busFeeAssignmentId: assignment.id,
              invoices: {
                create: {
                  studentId: student.id,
                  amount,
                  dueDate: dueDateObj,
                  status: "unpaid",
                  semester: targetSemester,
                },
              },
            },
          });
          batchBilled++;
        }

        totalStudentsBilled += batchBilled;
        if (batchBilled > 0) processedBatchNames.push(batch.name);
      }

      if (totalStudentsBilled === 0) {
        throw new Error("All students for this semester are already up to date.");
      }

      return {
        totalStudentsBilled,
        totalSkipped,
        processedBatches: processedBatchNames,
      };
    });

    res.status(201).json({
      message: `Assigned fees to ${result.totalStudentsBilled} students across ${result.processedBatches.length} batch(es). ${result.totalSkipped} student(s) skipped (already billed).`,
      ...result,
    });
  } catch (error: any) {
    console.error("Bulk fee assignment error:", error);
    res.status(500).json({ error: error.message || "Transaction failed." });
  }
};

// ─── 4. GET /semester-status?semester=X ───
// Unified view: merges student data with bus-fee invoice status for a semester
export const getSemesterBillingStatus = async (req: Request, res: Response) => {
  const semester = parseInt(req.query.semester as string);
  if (isNaN(semester)) {
    return res.status(400).json({ error: "Valid semester is required" });
  }

  try {
    // 1. Fetch all bus-service students for this semester with joins
    const students = await prisma.student.findMany({
      where: {
        bus_service: true,
        currentSemester: semester,
      },
      select: {
        id: true,
        name: true,
        admission_number: true,
        busStop: {
          select: { stopName: true, feeAmount: true },
        },
        class: {
          select: {
            batchDepartment: {
              select: {
                batch: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // 2. Get all bus-fee invoices for these students in this semester
    const studentIds = students.map((s) => s.id);
    const invoices = await prisma.invoice.findMany({
      where: {
        studentId: { in: studentIds },
        fee: {
          feeType: { contains: "Bus Fee" },
          semester,
          archived: false,
        },
      },
      select: {
        id: true,
        studentId: true,
        amount: true,
        status: true,
        dueDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Map: studentId → latest invoice
    const invoiceMap = new Map<number, (typeof invoices)[0]>();
    for (const inv of invoices) {
      if (!invoiceMap.has(inv.studentId)) {
        invoiceMap.set(inv.studentId, inv); // latest first (ordered by createdAt desc)
      }
    }

    // 4. Build unified response
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = students.map((student) => {
      const invoice = invoiceMap.get(student.id);
      let status: "not_billed" | "unpaid" | "paid" | "overdue" = "not_billed";

      if (invoice) {
        if (invoice.status === "paid") {
          status = "paid";
        } else if (invoice.status === "unpaid") {
          status = today > new Date(invoice.dueDate) ? "overdue" : "unpaid";
        } else {
          status = invoice.status as any;
        }
      }

      return {
        studentId: student.id,
        name: student.name,
        admissionNumber: student.admission_number || "N/A",
        batchName: student.class?.batchDepartment?.batch?.name || "Unassigned",
        stopName: student.busStop?.stopName || "N/A",
        feeAmount: student.busStop?.feeAmount || 0,
        status,
        invoiceId: invoice?.id || null,
        invoiceAmount: invoice?.amount || null,
        dueDate: invoice?.dueDate || null,
      };
    });

    // 5. Counts
    const counts = {
      total: result.length,
      notBilled: result.filter((r) => r.status === "not_billed").length,
      unpaid: result.filter((r) => r.status === "unpaid" || r.status === "overdue").length,
      paid: result.filter((r) => r.status === "paid").length,
    };

    res.json({ students: result, counts });
  } catch (error) {
    console.error("Semester status error:", error);
    res.status(500).json({ error: "Failed to fetch semester billing status" });
  }
};

export const getFeeBatches = async (_req: Request, res: Response) => {
  try {
    const batches = await prisma.feeDetails.groupBy({
      by: ["feeType", "semester", "dueDate"],
      where: {
        feeType: { contains: "Bus Fee" },
        archived: false, // ONLY fetch active batches
      },
      _count: { id: true },
      orderBy: { dueDate: "desc" },
    });

    const formattedBatches = batches.map((batch, index) => ({
      id: index,
      feeName: batch.feeType,
      semester: batch.semester,
      dueDate: batch.dueDate,
      studentCount: batch._count.id,
    }));

    res.json(formattedBatches);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch active fee batches" });
  }
};
// 2. Fetch specific student payment statuses for a chosen group

export const getBatchDetails = async (req: Request, res: Response) => {
  const { semester, feeName, dueDate } = req.query;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize time for comparison

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        dueDate: new Date(dueDate as string),
        fee: {
          feeType: feeName as string,
          semester: parseInt(semester as string),
        },
      },
      include: {
        student: {
          select: {
            name: true,
            busStop: { select: { stopName: true } },
          },
        },
      },
      orderBy: { student: { name: "asc" } },
    });

    // Map the status dynamically based on the current date
    const updatedDetails = invoices.map((inv) => {
      const isPastDue = today > new Date(inv.dueDate);
      let displayStatus = inv.status;

      // If database says unpaid but date is passed, show as overdue
      if (inv.status === "unpaid" && isPastDue) {
        displayStatus = "overdue" as any;
      }

      return { ...inv, status: displayStatus };
    });

    res.json(updatedDetails);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch details" });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  // Debugging: Log what the backend actually receives
  console.log("Updating Invoice ID:", id, "to Status:", status);

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: "Valid Invoice ID is required" });
  }

  try {
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status: status, // This must match your Enum (paid, unpaid, etc.)
      },
    });

    res.status(200).json(updatedInvoice);
  } catch (error: any) {
    console.error("Prisma Update Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const archiveFeeBatch = async (req: Request, res: Response) => {
  const { feeName, semester, dueDate } = req.body;

  try {
    // Update all records that belong to this specific "Batch"
    const updateCount = await prisma.feeDetails.updateMany({
      where: {
        feeType: feeName,
        semester: parseInt(semester),
        dueDate: new Date(dueDate),
        archived: false, // Only update ones that aren't already archived
      },
      data: {
        archived: true,
      },
    });

    if (updateCount.count === 0) {
      return res
        .status(404)
        .json({ message: "No active batch found matching these criteria." });
    }

    res.status(200).json({
      message: `Successfully archived ${updateCount.count} records for ${feeName} (S${semester}).`,
    });
  } catch (error) {
    console.error("Archive Error:", error);
    res.status(500).json({ error: "Failed to archive the fee batch." });
  }
};

export const getBusRequests = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.busRequest.findMany({
      where: { status: "pending" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admission_number: true,
            department: { select: { name: true } },
          },
        },
        bus: { select: { busName: true, busNumber: true } },
        busStop: { select: { stopName: true, feeAmount: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (error) {
    console.error("Error fetching bus requests:", error);
    res.status(500).json({ message: "Failed to fetch bus requests" });
  }
};

export const updateBusRequestStatus = async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the request AND the student's current semester
      const request = await tx.busRequest.findUnique({
        where: { id: Number(requestId) },
        include: {
          busStop: true,
          student: {
            select: {
              currentSemester: true, // Dynamically get the semester
            }
          }
        },
      });

      if (!request || request.status !== "pending") {
        throw new Error("Invalid or non-pending request");
      }

      // 2. Update request status
      const updatedRequest = await tx.busRequest.update({
        where: { id: Number(requestId) },
        data: { status: status as any },
      });

      // 3. If approved, Create an UNPAID Invoice with dynamic semester
      if (status === "approved") {
        await tx.feeDetails.create({
          data: {
            studentId: request.studentId,
            feeType: "Bus Fee - Enrollment",
            amount: request.busStop.feeAmount,
            dueDate: new Date(),
            semester: request.student?.currentSemester ?? 1,
            invoices: {
              create: {
                studentId: request.studentId,
                amount: request.busStop.feeAmount,
                dueDate: new Date(),
                status: "unpaid",
                feeStructureId: 3,
                semester: request.student?.currentSemester ?? 1,
              },
            },
          },
        });
      }

      return updatedRequest;
    });

    res.json({ message: `Request ${status}. Fee assigned for Semester ${result.status === 'approved' ? 'current' : 'N/A'}.`, result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyBusPayment = async (req: Request, res: Response) => {
  const { invoiceId } = req.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Invoice to 'paid'
      const invoice = await tx.invoice.update({
        where: { id: Number(invoiceId) },
        data: { status: "paid" },
        include: {
          student: true,
          // We need to find the original BusRequest to get the BusID and StopID
          // Since it's not directly linked, we search for an approved request for this student
        }
      });

      const busRequest = await tx.busRequest.findFirst({
        where: {
          studentId: invoice.studentId,
          status: "approved"
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!busRequest) throw new Error("No approved bus request found for this student.");

      // 2. NOW set bus_service to true and assign IDs
      const updatedStudent = await tx.student.update({
        where: { id: invoice.studentId },
        data: {
          bus_service: true,
          busId: busRequest.busId,
          busStopId: busRequest.busStopId,
        },
      });

      return { invoice, updatedStudent };
    });

    res.json({ message: "Payment verified. Bus service activated.", result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBusInvoices = async (req: Request, res: Response) => {
  const { status } = req.query;

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        // Filter by status if provided (e.g., 'unpaid')
        ...(status ? { status: status as any } : {}),
        // We specifically want bus-related fees
        fee: {
          feeType: {
            contains: "Bus Fee",
            mode: 'insensitive' // Makes it search for "bus fee", "Bus Fee", etc.
          }
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admission_number: true,
            department: {
              select: { name: true }
            },
            // We need the bus stop to show the admin where the student is traveling
            busStop: {
              select: { stopName: true, feeAmount: true }
            }
          }
        },
        fee: {
          select: {
            feeType: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(invoices);
  } catch (error) {
    console.error("Error fetching bus invoices:", error);
    return res.status(500).json({ message: "Failed to fetch invoices" });
  }
};
