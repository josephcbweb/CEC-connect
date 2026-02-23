"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const router = express_1.default.Router();
router.get("/viewStats", adminController_1.fetchStats);
router.get("/students", adminController_1.fetchAllStudents);
router.post("/deleteStudents", adminController_1.deleteStudents);
router.post("/restoreStudents", adminController_1.restoreStudents);
router.post("/demoteStudents", adminController_1.demoteStudents);
router.get("/students/:id", adminController_1.getStudentDetails);
exports.default = router;
