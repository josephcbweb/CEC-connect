"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const batchController_1 = require("../controllers/batchController");
const router = express_1.default.Router();
// Batch routes
router.get("/batches", batchController_1.getAllBatches);
router.get("/batches/:id", batchController_1.getBatchById);
router.post("/batches/:id/departments", batchController_1.addDepartmentToBatch);
// Available advisors
router.get("/users/available-advisors", batchController_1.getAvailableAdvisors);
// Class CRUD operations
router.post("/classes", batchController_1.createClass);
router.put("/classes/:id", batchController_1.updateClass);
router.delete("/classes/:id", batchController_1.deleteClass);
exports.default = router;
