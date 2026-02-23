import express from "express";
import {
  toggleSettings,
  getSemesterStats,
  promoteStudents,
  getSettings,
  getActiveRequestCount,
} from "../controllers/settingsController";
import {
  getDueConfigs,
  createDueConfig,
  deleteDueConfig,
  getServiceDepartments,
  createServiceDepartment,
  updateServiceDepartment,
  deleteServiceDepartment,
  getAllUsers,
} from "../controllers/dueSettingsController";

const router = express.Router();

router.get("/", getSettings);
router.get("/active-requests-count", getActiveRequestCount);
router.put("/settings", toggleSettings);
router.get("/semStats", getSemesterStats);
router.post("/promote", promoteStudents);
router.get("/users", getAllUsers);

// Due Configuration Routes
router.get("/due-configs", getDueConfigs);
router.post("/due-configs", createDueConfig);
router.delete("/due-configs/:id", deleteDueConfig);
router.get("/service-departments", getServiceDepartments);
router.post("/service-departments", createServiceDepartment);
router.put("/service-departments/:id", updateServiceDepartment);
router.delete("/service-departments/:id", deleteServiceDepartment);

export default router;
