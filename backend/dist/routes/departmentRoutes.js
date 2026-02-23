"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const departmentController_1 = require("../controllers/departmentController");
const router = express_1.default.Router();
router.get("/", departmentController_1.getDepartment);
router.post("/", departmentController_1.addDepartment);
router.delete("/:id", departmentController_1.deleteDepartment);
router.put("/:id/hod", departmentController_1.updateDepartmentHod);
router.get("/faculty/eligible", departmentController_1.getEligibleFaculty);
exports.default = router;
