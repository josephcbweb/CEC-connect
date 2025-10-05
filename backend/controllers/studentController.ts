import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();
export const getStudents = async (req: Request, res: Response) => {
  const result = await prisma.student.findMany({
    include: { department: true, invoices: true, feeDetails: true },
  });
  res.status(201).json(result);
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
        invoices: {
          orderBy: {
            dueDate: "asc",
          },
          include: {
            fee: true,
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
      error
    );
    res.status(500).json({ error: "Failed to retrieve fee details." });
  }
};
