import express from "express";
import {
  createFee,
  getAllFees,
  updateFee,
  deleteFee,
  assignFeeAndGenerateInvoices,
} from "../controllers/feeController";

const router = express.Router();

// --- Fee Structure Routes ---
router.post("/", createFee);
router.get("/", getAllFees);
router.put("/:id", updateFee);
router.delete("/:id", deleteFee);

// --- Fee Assignment Route ---
router.post("/assign", assignFeeAndGenerateInvoices);

export default router;
