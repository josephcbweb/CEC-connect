import express from "express";
import { Router } from "express";
import {
  deleteStudents,
  fetchAllStudents,
  fetchStats,
  getStudentDetails,
  restoreStudents,
  demoteStudents
} from "../controllers/adminController";

const router = express.Router();

router.get("/viewStats", fetchStats);
router.get("/students", fetchAllStudents);
router.post("/deleteStudents", deleteStudents);
router.post("/restoreStudents", restoreStudents);
router.post("/demoteStudents", demoteStudents);
router.get("/students/:id", getStudentDetails);

export default router;
