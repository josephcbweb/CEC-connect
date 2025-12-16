import express from "express";
import {
  getAdmissions,
  getStats,
  getAdmissionById,
  updateAdmissionStatus,
  getAdmissionWindows,
  updateAdmissionWindow,
  createAdmissionWindow,
  deleteAdmissionWindow,
  checkAdmissionStatus,
  validateStudent,
  submitAdmissionForm,
  getAdmissionByNumber,
  bulkUpdateStatus,
} from "../controllers/admissionController";

const router = express.Router();

// Public routes (for students)
router.get("/status", checkAdmissionStatus);
router.post("/validate", validateStudent);
router.post("/submit", submitAdmissionForm);
router.get("/check/:admissionNumber", getAdmissionByNumber);

// Admin routes (protected - add auth middleware in production)
router.get("/admin/admissions", getAdmissions);
router.get("/admin/stats", getStats);
router.get("/admin/admissions/:id", getAdmissionById);
router.put("/admin/admissions/:id/status", updateAdmissionStatus);
router.post("/admin/admissions/bulk-update", bulkUpdateStatus);
router.get("/admin/admission-windows", getAdmissionWindows);
router.post("/admin/admission-windows", createAdmissionWindow);
router.put("/admin/admission-windows/:id", updateAdmissionWindow);
router.delete("/admin/admission-windows/:id", deleteAdmissionWindow);

export default router;
