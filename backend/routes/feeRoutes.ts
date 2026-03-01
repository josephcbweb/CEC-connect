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
import AuthMiddleware from "../middlewares/authMiddlewares";
import { requirePermission } from "../middlewares/permissionMiddleware";

const router = express.Router();

// All fee routes require authentication
router.use(AuthMiddleware.authenticate);

// --- Fee Structure CRUD Routes ---
router.get("/", getAllFeeStructures);
router.post("/", requirePermission("fee:create_structure"), createFeeStructure);
router.put(
  "/:id",
  requirePermission("fee:update_structure"),
  updateFeeStructure,
);
router.delete(
  "/:id",
  requirePermission("fee:delete_structure"),
  deleteFeeStructure,
);

// --- Fee Assignment and Payment Routes ---
router.post("/assign", requirePermission("fee:assign"), assignFeeToStudents);
router.post(
  "/invoices/mark-paid",
  requirePermission("fee:mark_paid"),
  markInvoiceAsPaid,
);
router.get("/invoices", getAllInvoices);

export default router;
