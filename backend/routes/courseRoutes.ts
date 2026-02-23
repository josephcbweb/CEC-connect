import express from "express";
import {
  getAllCourses,
  createCourse,
  getStudentCourses,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController";

const router = express.Router();

router.get("/", getAllCourses);
router.post("/", createCourse); // Should be admin only
router.put("/:id", updateCourse); // Should be admin only
router.delete("/:id", deleteCourse); // Should be admin only
router.get("/student", getStudentCourses);

export default router;
