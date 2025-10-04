import { PrismaClient, InvoiceStatus } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// --- Fee Structure CRUD ---

export const createFeeStructure = async (req: Request, res: Response) => {
  try {
    const { name, description, amount } = req.body;
    if (!name || amount === undefined) {
      return res.status(400).json({ error: "Name and amount are required." });
    }
    const newFeeStructure = await prisma.feeStructure.create({
      data: { name, description, amount: parseFloat(amount) },
    });
    res.status(201).json(newFeeStructure);
  } catch (error) {
    console.error("Error creating fee structure:", error);
    res.status(500).json({ error: "Failed to create fee structure." });
  }
};

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({});
    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to retrieve invoices." });
  }
};

export const getAllFeeStructures = async (req: Request, res: Response) => {
  try {
    const feeStructures = await prisma.feeStructure.findMany();
    res.status(200).json(feeStructures);
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    res.status(500).json({ error: "Failed to retrieve fee structures." });
  }
};

export const updateFeeStructure = async (req: Request, res: Response) => {
  try {
    const feeId = parseInt(req.params.id);
    const { name, description, amount } = req.body;
    const updatedFeeStructure = await prisma.feeStructure.update({
      where: { id: feeId },
      data: {
        name,
        description,
        amount: amount ? parseFloat(amount) : undefined,
      },
    });
    res.status(200).json(updatedFeeStructure);
  } catch (error) {
    res.status(500).json({
      error: `Failed to update fee structure with ID ${req.params.id}.`,
    });
  }
};

export const deleteFeeStructure = async (req: Request, res: Response) => {
  try {
    const feeId = parseInt(req.params.id);
    await prisma.feeStructure.delete({ where: { id: feeId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: `Failed to delete fee structure with ID ${req.params.id}.`,
    });
  }
};

// --- Fee Assignment and Payment ---

export const assignFeeToStudents = async (req: Request, res: Response) => {
  try {
    const { feeStructureId, studentIds, dueDate } = req.body;

    if (
      !feeStructureId ||
      !studentIds ||
      !Array.isArray(studentIds) ||
      !dueDate
    ) {
      return res.status(400).json({
        error:
          "Fee structure ID, student IDs array, and due date are required.",
      });
    }

    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
    });

    if (!feeStructure) {
      return res.status(404).json({ error: "Fee Structure not found." });
    }

    // FIX: Increased transaction timeout to handle large batches of students.
    // The default is 5 seconds, which can be too short for many database writes.
    await prisma.$transaction(
      async (tx) => {
        for (const studentId of studentIds) {
          // Step 1: Create a FeeDetails entry for this specific assignment.
          // This represents the instance of the fee being applied to the student.
          const feeDetail = await tx.feeDetails.create({
            data: {
              studentId: studentId,
              feeType: feeStructure.name,
              amount: feeStructure.amount,
              dueDate: new Date(dueDate), // Use the provided due date
            },
          });

          // Step 2: Create an Invoice linked to the new FeeDetails and the FeeStructure template.
          await tx.invoice.create({
            data: {
              studentId: studentId,
              feeId: feeDetail.id,
              feeStructureId: feeStructureId,
              amount: feeStructure.amount,
              dueDate: new Date(dueDate),
              issueDate: new Date(),
              status: InvoiceStatus.unpaid,
            },
          });
        }
      },
      {
        timeout: 3000000,
      }
    );

    res
      .status(201)
      .json({ message: "Fee assigned and invoices generated successfully." });
  } catch (error) {
    console.error("Error assigning fee structures:", error);
    res
      .status(500)
      .json({ error: "Failed to assign fees and generate invoices." });
  }
};

export const markInvoiceAsPaid = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const { paymentMethod } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ error: "Payment method is required." });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: parseInt(invoiceId) },
      data: { status: InvoiceStatus.paid },
    });

    await prisma.payment.create({
      data: {
        invoiceId: updatedInvoice.id,
        amount: updatedInvoice.amount,
        paymentMethod: paymentMethod,
        transactionId: `MANUAL_${updatedInvoice.id}_${Date.now()}`,
        status: "successful",
      },
    });

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error(
      `Error marking invoice ${req.params.invoiceId} as paid:`,
      error
    );
    res.status(500).json({ error: "Failed to mark invoice as paid." });
  }
};
