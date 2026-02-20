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
  getApprovedStudentsForAssignment,
  getClassesForBatch,
  getUpcomingBatches,
  assignStudentToClass,
  autoAssignStudentsToClasses,
  bulkAssignToClass,
  getPublicDepartments,
  autoAssignBatch,
} from "../controllers/admissionController";

const router = express.Router();

// Public routes (for students)
router.get("/status", checkAdmissionStatus);
router.post("/validate", validateStudent);
router.post("/submit", submitAdmissionForm);
router.get("/check/:admissionNumber", getAdmissionByNumber);
router.get("/departments", getPublicDepartments);

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

// Class assignment routes
router.get("/admin/approved-students", getApprovedStudentsForAssignment);
router.get("/admin/batches", getUpcomingBatches);
router.get("/admin/batches/:batchId/classes", getClassesForBatch);
router.post("/admin/assign-student", assignStudentToClass);
router.post("/admin/auto-assign", autoAssignStudentsToClasses);
router.post("/admin/auto-assign-batch", autoAssignBatch);
router.post("/admin/bulk-assign", bulkAssignToClass);

export default router;
