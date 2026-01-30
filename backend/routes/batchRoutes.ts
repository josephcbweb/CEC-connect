import express from "express";
import {
    getAllBatches,
    getBatchById,
    getAvailableAdvisors,
    createClass,
    updateClass,
    deleteClass,
} from "../controllers/batchController";

const router = express.Router();

// Batch routes
router.get("/batches", getAllBatches);
router.get("/batches/:id", getBatchById);

// Available advisors
router.get("/users/available-advisors", getAvailableAdvisors);

// Class CRUD operations
router.post("/classes", createClass);
router.put("/classes/:id", updateClass);
router.delete("/classes/:id", deleteClass);

export default router;
