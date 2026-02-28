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
  deleteStaleAdmissions,
  deleteAdmissionEntry,
} from "../controllers/admissionController";
import AuthMiddleware from "../middlewares/authMiddlewares";
import { requirePermission } from "../middlewares/permissionMiddleware";

const router = express.Router();

// Public routes (for students)
router.get("/status", checkAdmissionStatus);
router.post("/validate", validateStudent);
router.post("/submit", submitAdmissionForm);
router.get("/check/:admissionNumber", getAdmissionByNumber);
router.get("/departments", getPublicDepartments);

// Admin routes (protected)
router.get("/admin/admissions", AuthMiddleware.authenticate, getAdmissions);
router.get("/admin/stats", AuthMiddleware.authenticate, getStats);
router.get(
  "/admin/admissions/:id",
  AuthMiddleware.authenticate,
  getAdmissionById,
);
router.put(
  "/admin/admissions/:id/status",
  AuthMiddleware.authenticate,
  requirePermission("admission:update_status"),
  updateAdmissionStatus,
);
router.delete(
  "/admin/admissions/:id",
  AuthMiddleware.authenticate,
  requirePermission("admission:delete"),
  deleteAdmissionEntry,
);
router.post(
  "/admin/admissions/bulk-update",
  AuthMiddleware.authenticate,
  requirePermission("admission:bulk_update"),
  bulkUpdateStatus,
);
router.get(
  "/admin/admission-windows",
  AuthMiddleware.authenticate,
  getAdmissionWindows,
);
router.post(
  "/admin/admission-windows",
  AuthMiddleware.authenticate,
  requirePermission("admission:manage_windows"),
  createAdmissionWindow,
);
router.put(
  "/admin/admission-windows/:id",
  AuthMiddleware.authenticate,
  requirePermission("admission:manage_windows"),
  updateAdmissionWindow,
);
router.delete(
  "/admin/admission-windows/:id",
  AuthMiddleware.authenticate,
  requirePermission("admission:manage_windows"),
  deleteAdmissionWindow,
);
router.delete(
  "/admin/admissions/stale",
  AuthMiddleware.authenticate,
  requirePermission("admission:delete_stale"),
  deleteStaleAdmissions,
);

// Class assignment routes
router.get(
  "/admin/approved-students",
  AuthMiddleware.authenticate,
  getApprovedStudentsForAssignment,
);
router.get("/admin/batches", AuthMiddleware.authenticate, getUpcomingBatches);
router.get(
  "/admin/batches/:batchId/classes",
  AuthMiddleware.authenticate,
  getClassesForBatch,
);
router.post(
  "/admin/assign-student",
  AuthMiddleware.authenticate,
  requirePermission("admission:assign_class"),
  assignStudentToClass,
);
router.post(
  "/admin/auto-assign",
  AuthMiddleware.authenticate,
  requirePermission("admission:assign_class"),
  autoAssignStudentsToClasses,
);
router.post(
  "/admin/auto-assign-batch",
  AuthMiddleware.authenticate,
  requirePermission("admission:assign_class"),
  autoAssignBatch,
);
router.post(
  "/admin/bulk-assign",
  AuthMiddleware.authenticate,
  requirePermission("admission:assign_class"),
  bulkAssignToClass,
);

export default router;
