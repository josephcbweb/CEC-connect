"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admissionController_1 = require("../controllers/admissionController");
const router = express_1.default.Router();
// Public routes (for students)
router.get("/status", admissionController_1.checkAdmissionStatus);
router.post("/validate", admissionController_1.validateStudent);
router.post("/submit", admissionController_1.submitAdmissionForm);
router.get("/check/:admissionNumber", admissionController_1.getAdmissionByNumber);
router.get("/departments", admissionController_1.getPublicDepartments);
// Admin routes (protected - add auth middleware in production)
router.get("/admin/admissions", admissionController_1.getAdmissions);
router.get("/admin/stats", admissionController_1.getStats);
router.get("/admin/admissions/:id", admissionController_1.getAdmissionById);
router.put("/admin/admissions/:id/status", admissionController_1.updateAdmissionStatus);
router.post("/admin/admissions/bulk-update", admissionController_1.bulkUpdateStatus);
router.get("/admin/admission-windows", admissionController_1.getAdmissionWindows);
router.post("/admin/admission-windows", admissionController_1.createAdmissionWindow);
router.put("/admin/admission-windows/:id", admissionController_1.updateAdmissionWindow);
router.delete("/admin/admission-windows/:id", admissionController_1.deleteAdmissionWindow);
// Class assignment routes
router.get("/admin/approved-students", admissionController_1.getApprovedStudentsForAssignment);
router.get("/admin/batches", admissionController_1.getUpcomingBatches);
router.get("/admin/batches/:batchId/classes", admissionController_1.getClassesForBatch);
router.post("/admin/assign-student", admissionController_1.assignStudentToClass);
router.post("/admin/auto-assign", admissionController_1.autoAssignStudentsToClasses);
router.post("/admin/bulk-assign", admissionController_1.bulkAssignToClass);
exports.default = router;
