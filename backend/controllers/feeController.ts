import { PrismaClient, InvoiceStatus } from "@prisma/client";
import { z } from "zod";
import { Request, Response } from "express";

const prisma = new PrismaClient();

const isoDateString = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Due date must be a valid ISO date string.",
});

const feeDetailSchema = z.object({
  feeType: z.string().min(3, "Fee type is required."),
  amount: z.number().positive("Amount must be a positive number."),
  dueDate: isoDateString,
  studentId: z.number().int().positive(),
});

export const createFee = async (req: Request, res: Response) => {
  try {
    const feeData = feeDetailSchema.parse(req.body);
    const newFee = await prisma.feeDetails.create({
      data: {
        ...feeData,
        dueDate: new Date(feeData.dueDate),
      },
    });
    res.status(201).json(newFee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error("Error creating fee:", error);
    res.status(500).json({ error: "Failed to create fee structure." });
  }
};

/**
 * @desc    Get all fee structures
 */
export const getAllFees = async (req: Request, res: Response) => {
  try {
    const fees = await prisma.feeDetails.findMany({
      include: { student: true },
    });
    res.json(fees);
  } catch (error) {
    console.error("Error fetching fees:", error);
    res.status(500).json({ error: "Failed to retrieve fee structures." });
  }
};

/**
 * @desc    Update a fee structure
 */
export const updateFee = async (req: Request, res: Response) => {
  try {
    const feeId = parseInt(req.params.id);
    const feeData = feeDetailSchema.partial().parse(req.body);

    const updatedFee = await prisma.feeDetails.update({
      where: { id: feeId },
      data: {
        ...feeData,
        dueDate: feeData.dueDate ? new Date(feeData.dueDate) : undefined,
      },
    });
    res.json(updatedFee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error("Error updating fee:", error);
    res.status(500).json({
      error: `Failed to update fee structure with ID ${req.params.id}.`,
    });
  }
};

/**
 * @desc    Delete a fee structure
 */
export const deleteFee = async (req: Request, res: Response) => {
  try {
    const feeId = parseInt(req.params.id);
    await prisma.feeDetails.delete({
      where: { id: feeId },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting fee:", error);
    res.status(500).json({
      error: `Failed to delete fee structure with ID ${req.params.id}.`,
    });
  }
};

const assignFeeSchema = z.object({
  feeType: z.string(),
  amount: z.number().positive(),
  dueDate: isoDateString,
  target: z.object({
    type: z.enum(["student", "department"]),
    id: z.number().int().positive(),
  }),
});

/**
 * @desc    Assign a fee to students and generate invoices
 */
export const assignFeeAndGenerateInvoices = async (
  req: Request,
  res: Response
) => {
  try {
    const { feeType, amount, dueDate, target } = assignFeeSchema.parse(
      req.body
    );

    let studentsToInvoice: Array<{ id: number }> = [];

    if (target.type === "student") {
      const student = await prisma.student.findUnique({
        where: { id: target.id },
      });
      if (student) studentsToInvoice.push(student);
    } else if (target.type === "department") {
      studentsToInvoice = await prisma.student.findMany({
        where: { departmentId: target.id },
      });
    }

    if (studentsToInvoice.length === 0) {
      return res
        .status(404)
        .json({ error: "No students found for the given target." });
    }

    const transactionResult = await prisma.$transaction(async (tx) => {
      const createdInvoices = [];
      for (const student of studentsToInvoice) {
        const feeDetail = await tx.feeDetails.create({
          data: {
            studentId: student.id,
            feeType: feeType,
            amount: amount,
            dueDate: new Date(dueDate),
          },
        });

        const invoice = await tx.invoice.create({
          data: {
            studentId: student.id,
            feeId: feeDetail.id,
            amount: amount,
            dueDate: new Date(dueDate),
            issueDate: new Date(),
            status: InvoiceStatus.unpaid,
          },
        });
        createdInvoices.push(invoice);
      }
      return createdInvoices;
    });

    res.status(201).json({
      message: `Successfully generated ${transactionResult.length} invoices.`,
      invoices: transactionResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error("Error assigning fees:", error);
    res
      .status(500)
      .json({ error: "Failed to assign fees and generate invoices." });
  }
};
