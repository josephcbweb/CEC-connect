"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const courseController_1 = require("../controllers/courseController");
const router = express_1.default.Router();
router.get("/", courseController_1.getAllCourses);
router.post("/", courseController_1.createCourse); // Should be admin only
router.get("/student", courseController_1.getStudentCourses);
exports.default = router;
