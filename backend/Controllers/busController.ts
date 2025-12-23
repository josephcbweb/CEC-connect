import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

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
          select: {
            id: true,
            name: true,
            admission_number: true,
            student_phone_number: true,
            department: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.status(200).json({
      busId: bus.id,
      busName: bus.busName,
      busNumber: bus.busNumber,
      capacity: bus.totalSeats,
      numberOfStudents: bus.students.length,
      registrationNumber: bus.registrationNo,
      driverName: bus.driverName,
      driverPhone: bus.driverPhone,
      status: bus.isActive ? "Active" : "Inactive",
      stops: bus.stops,
      students: bus.students
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