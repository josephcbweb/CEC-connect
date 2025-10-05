import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();
export const getStudents = async (req: Request, res: Response) => {
  const result = await prisma.student.findMany({
    include: { department: true, invoices: true, feeDetails: true },
  });
  res.status(201).json(result);
};
