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
