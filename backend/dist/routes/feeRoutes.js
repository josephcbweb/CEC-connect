"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const feeController_1 = require("../controllers/feeController");
const router = express_1.default.Router();
// --- Fee Structure CRUD Routes ---
router.post("/", feeController_1.createFeeStructure);
router.get("/", feeController_1.getAllFeeStructures);
router.put("/:id", feeController_1.updateFeeStructure);
router.delete("/:id", feeController_1.deleteFeeStructure);
// --- Fee Assignment and Payment Routes ---
router.post("/assign", feeController_1.assignFeeToStudents);
router.post("/invoices/mark-paid", feeController_1.markInvoiceAsPaid);
router.get("/invoices", feeController_1.getAllInvoices);
exports.default = router;
