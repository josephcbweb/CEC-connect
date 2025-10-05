import express from "express";
import {
  createFeeStructure,
  getAllFeeStructures,
  updateFeeStructure,
  deleteFeeStructure,
  assignFeeToStudents,
  markInvoiceAsPaid,
  getAllInvoices,
} from "../controllers/feeController";

const router = express.Router();

// --- Fee Structure CRUD Routes ---
router.post("/", createFeeStructure);
router.get("/", getAllFeeStructures);
router.put("/:id", updateFeeStructure);
router.delete("/:id", deleteFeeStructure);

// --- Fee Assignment and Payment Routes ---
router.post("/assign", assignFeeToStudents);
router.post("/invoices/mark-paid", markInvoiceAsPaid);
router.get("/invoices", getAllInvoices);

export default router;
