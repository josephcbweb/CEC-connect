"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const studentController_1 = require("../controllers/studentController");
const router = express_1.default.Router();
router.get("/all", studentController_1.getStudents);
router.get("/:id/fees", studentController_1.getStudentFeeDetails);
router.get("/profile/:id", studentController_1.getStudentProfile);
router.patch("/update/:id", studentController_1.updateStudentProfile);
router.get("/bus/routes", studentController_1.getAllBusRoutes);
router.post("/request-bus", studentController_1.requestBusService);
exports.default = router;
