import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { InvoiceStatus } from "../generated/prisma/enums";

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
    const { feeStructureId, studentIds, dueDate, userId } = req.body;

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

    // Pre-fetch all students to get their current semester
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, currentSemester: true },
    });

    const studentMap = new Map(students.map((s) => [s.id, s]));

    await prisma.$transaction(
      async (tx) => {
        for (const studentId of studentIds) {
          const student = studentMap.get(studentId);
          const semester = student?.currentSemester;

          // Step 1: Create a FeeDetails entry for this specific assignment.
          const feeDetail = await tx.feeDetails.create({
            data: {
              studentId: studentId,
              feeType: feeStructure.name,
              amount: feeStructure.amount,
              dueDate: new Date(dueDate),
              semester: semester,
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
              semester: semester,
            },
          });

          // Step 3: Send notification to the student
          await tx.notification.create({
            data: {
              title: "New Fee Assigned",
              description: `A new fee "${feeStructure.name}" of ₹${feeStructure.amount} has been assigned to you. Due date: ${new Date(dueDate).toLocaleDateString()}.`,
              targetType: "STUDENT",
              targetValue: studentId.toString(),
              status: "published",
              priority: "NORMAL",
              senderId: userId ? Number(userId) : 1,
            }
          });
        }
      },
      {
        timeout: 3000000,
      },
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
    const { invoiceId, paymentMethod, userId } = req.body;
    if (!paymentMethod) {
      return res.status(400).json({ error: "Payment method is required." });
    }

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id: parseInt(invoiceId) },
        data: { status: InvoiceStatus.paid },
        include: {
          student: true,
          FeeStructure: { select: { name: true } },
        },
      });

      // Update the invoice with the current semester of the student
      await tx.invoice.update({
        where: { id: parseInt(invoiceId) },
        data: { semester: inv.student.currentSemester },
      });

      await tx.payment.create({
        data: {
          invoiceId: inv.id,
          amount: inv.amount,
          paymentMethod: paymentMethod,
          transactionId: `MANUAL_${inv.id}_${Date.now()}`,
          status: "successful",
        },
      });

      // Send notification to the student
      await tx.notification.create({
        data: {
          title: "Payment Successful",
          description: `Your payment for "${inv.FeeStructure?.name || "Fee"}" has been successfully recorded.`,
          targetType: "STUDENT",
          targetValue: inv.studentId.toString(),
          status: "published",
          priority: "NORMAL",
          senderId: userId ? Number(userId) : 1,
        }
      });

      return inv;
    });

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error(
      `Error marking invoice ${req.body.invoiceId} as paid:`,
      error,
    );
    res.status(500).json({ error: "Failed to mark invoice as paid." });
  }
};
