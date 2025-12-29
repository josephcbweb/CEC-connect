import express from "express";
import {
  getAllCourses,
  createCourse,
  getStudentCourses,
} from "../controllers/courseController";

const router = express.Router();

router.get("/", getAllCourses);
router.post("/", createCourse); // Should be admin only
router.get("/student", getStudentCourses);

export default router;
