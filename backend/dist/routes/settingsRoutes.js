"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const settingsController_1 = require("../controllers/settingsController");
const dueSettingsController_1 = require("../controllers/dueSettingsController");
const router = express_1.default.Router();
router.get("/", settingsController_1.getSettings);
router.get("/active-requests-count", settingsController_1.getActiveRequestCount);
router.put("/settings", settingsController_1.toggleSettings);
router.get("/semStats", settingsController_1.getSemesterStats);
router.post("/promote", settingsController_1.promoteStudents);
router.get("/users", dueSettingsController_1.getAllUsers);
// Due Configuration Routes
router.get("/due-configs", dueSettingsController_1.getDueConfigs);
router.post("/due-configs", dueSettingsController_1.createDueConfig);
router.delete("/due-configs/:id", dueSettingsController_1.deleteDueConfig);
router.get("/service-departments", dueSettingsController_1.getServiceDepartments);
router.post("/service-departments", dueSettingsController_1.createServiceDepartment);
router.put("/service-departments/:id", dueSettingsController_1.updateServiceDepartment);
router.delete("/service-departments/:id", dueSettingsController_1.deleteServiceDepartment);
exports.default = router;
