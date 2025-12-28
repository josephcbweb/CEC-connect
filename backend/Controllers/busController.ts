import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const BUS_FEE_KEY = "BUS_FEE_ENABLED";

export const fetchBus = async (req:Request,res:Response)=>{
    try{
        const buses = await prisma.bus.findMany({
            orderBy:{
                busNumber : "asc",
            }
        });
        return res.status(200).json({
        count: buses.length,
        buses,
        });
    }
    catch (error) {
        console.error("Error fetching buses:", error);

        return res.status(500).json({
        message: "Failed to fetch bus list",
        });
    }
}

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
    if (
      !busNumber ||
      !totalSeats ||
      !driverName ||
      !driverPhone
    ) {
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
            feeAmount: true
          }
        },
        students: {
          where: {
            bus_service: true
          },
          include: {
            department: {
              select: { name: true }
            },
            busStop: {                     // ✅ THIS WAS MISSING
              select: {
                id: true,
                stopName: true,
                feeAmount: true
              }
            }
          }
        }
      }
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
      stopFee: student.busStop?.feeAmount || 0
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
      students: formattedStudents
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
      departmentCode: s.department.department_code,
    }));

    return res.status(200).json(modifiedStudent);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch students" });
  }
};

export const getUniqueSemester = async(req:Request,res:Response)=>{
  try{
    const semesters = await prisma.student.groupBy({
    by:['currentSemester'],
    orderBy:{currentSemester: 'asc' },
  });
  res.json(semesters.map(s => s.currentSemester));
  }
  catch (error) {
    res.status(500).json({ error: "Failed to fetch semesters" });
  }
};

export const assignBusFees = async (req: Request, res: Response) => {
  const { semester, dueDate, feeName } = req.body;

  try {
    // 1. Validation: Check if there is already an active (unarchived) batch for this semester
    const activeBatchExists = await prisma.feeDetails.findFirst({
      where: {
        semester: parseInt(semester),
        archived: false,
        feeType: { contains: 'Bus Fee' }
      }
    });

    if (activeBatchExists && semester !== 'all') {
      return res.status(400).json({ 
        message: `Cannot assign new fees. Please archive the existing active batch for Semester ${semester} first.` 
      });
    }

    // 2. Fetch students
    const students = await prisma.student.findMany({
      where: {
        bus_service: true,
        busStopId: { not: null },
        ...(semester !== 'all' ? { currentSemester: parseInt(semester) } : {})
      },
      include: { busStop: true }
    });

    if (!students.length) return res.status(404).json({ message: "No students found." });

    // 3. Create records in transaction
    await prisma.$transaction(
      students.map((student) => {
        const amount = student.busStop?.feeAmount || 0;
        return prisma.feeDetails.create({
          data: {
            studentId: student.id,
            feeType: feeName,
            amount,
            dueDate: new Date(dueDate),
            semester: student.currentSemester,
            archived: false, // Default state
            invoices: {
              create: {
                studentId: student.id,
                amount,
                dueDate: new Date(dueDate),
                status: 'unpaid'
              }
            }
          }
        });
      })
    );

    res.status(201).json({ message: `Assigned fees to ${students.length} students.` });
  } catch (error) {
    res.status(500).json({ error: "Transaction failed." });
  }
};

export const getFeeBatches = async (_req: Request, res: Response) => {
  try {
    const batches = await prisma.feeDetails.groupBy({
      by: ['feeType', 'semester', 'dueDate'],
      where: {
        feeType: { contains: 'Bus Fee' },
        archived: false // ONLY fetch active batches
      },
      _count: { id: true },
      orderBy: { dueDate: 'desc' }
    });

    const formattedBatches = batches.map((batch, index) => ({
      id: index,
      feeName: batch.feeType,
      semester: batch.semester,
      dueDate: batch.dueDate,
      studentCount: batch._count.id
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
        }
      },
      include: {
        student: {
          select: {
            name: true,
            busStop: { select: { stopName: true } }
          }
        }
      },
      orderBy: { student: { name: 'asc' } }
    });

    // Map the status dynamically based on the current date
    const updatedDetails = invoices.map(inv => {
      const isPastDue = today > new Date(inv.dueDate);
      let displayStatus = inv.status;

      // If database says unpaid but date is passed, show as overdue
      if (inv.status === 'unpaid' && isPastDue) {
        displayStatus = 'overdue' as any; 
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
        id: parseInt(id) 
      },
      data: { 
        status: status // This must match your Enum (paid, unpaid, etc.)
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
        archived: false // Only update ones that aren't already archived
      },
      data: {
        archived: true
      }
    });

    if (updateCount.count === 0) {
      return res.status(404).json({ message: "No active batch found matching these criteria." });
    }

    res.status(200).json({ 
      message: `Successfully archived ${updateCount.count} records for ${feeName} (S${semester}).` 
    });
  } catch (error) {
    console.error("Archive Error:", error);
    res.status(500).json({ error: "Failed to archive the fee batch." });
  }
};