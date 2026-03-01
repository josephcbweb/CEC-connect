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
import AuthMiddleware from "../middlewares/authMiddlewares";
import { requirePermission } from "../middlewares/permissionMiddleware";

const router = express.Router();

router.get("/", getSettings);
router.get("/active-requests-count", getActiveRequestCount);
router.put("/settings", AuthMiddleware.authenticate, toggleSettings);
router.get("/semStats", getSemesterStats);
router.post("/promote", AuthMiddleware.authenticate, promoteStudents);
router.get("/users", AuthMiddleware.authenticate, getAllUsers);

// Due Configuration Routes
router.get("/due-configs", AuthMiddleware.authenticate, getDueConfigs);
router.post(
  "/due-configs",
  AuthMiddleware.authenticate,
  requirePermission("due:create_config"),
  createDueConfig,
);
router.delete(
  "/due-configs/:id",
  AuthMiddleware.authenticate,
  requirePermission("due:delete_config"),
  deleteDueConfig,
);
router.get(
  "/service-departments",
  AuthMiddleware.authenticate,
  getServiceDepartments,
);
router.post(
  "/service-departments",
  AuthMiddleware.authenticate,
  requirePermission("due:manage_service_dept"),
  createServiceDepartment,
);
router.put(
  "/service-departments/:id",
  AuthMiddleware.authenticate,
  requirePermission("due:manage_service_dept"),
  updateServiceDepartment,
);
router.delete(
  "/service-departments/:id",
  AuthMiddleware.authenticate,
  requirePermission("due:manage_service_dept"),
  deleteServiceDepartment,
);

export default router;
