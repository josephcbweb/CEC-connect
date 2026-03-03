import express from "express";
import {
    getAllBatches,
    getBatchById,
    getAvailableAdvisors,
    createClass,
    updateClass,
    deleteClass,
    addDepartmentToBatch,
    toggleBatchStatus,
} from "../Controllers/batchController";

const router = express.Router();

// Batch routes
router.get("/batches", getAllBatches);
router.get("/batches/:id", getBatchById);
router.post("/batches/:id/departments", addDepartmentToBatch);
router.put("/batches/:id/status", toggleBatchStatus);

// Available advisors
router.get("/users/available-advisors", getAvailableAdvisors);

// Class CRUD operations
router.post("/classes", createClass);
router.put("/classes/:id", updateClass);
router.delete("/classes/:id", deleteClass);

export default router;

