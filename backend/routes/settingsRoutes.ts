import express from "express";
import {
  toggleSettings,
  getSemesterStats,
  promoteStudents,
  getSettings,
} from "../controllers/settingsController";
import {
  getDueConfigs,
  createDueConfig,
  deleteDueConfig,
  getServiceDepartments,
  createServiceDepartment,
  deleteServiceDepartment,
} from "../controllers/dueSettingsController";

const router = express.Router();

router.get("/", getSettings);
router.put("/settings", toggleSettings);
router.get("/semStats", getSemesterStats);
router.post("/promote", promoteStudents);

// Due Configuration Routes
router.get("/due-configs", getDueConfigs);
router.post("/due-configs", createDueConfig);
router.delete("/due-configs/:id", deleteDueConfig);
router.get("/service-departments", getServiceDepartments);
router.post("/service-departments", createServiceDepartment);
router.delete("/service-departments/:id", deleteServiceDepartment);

export default router;
