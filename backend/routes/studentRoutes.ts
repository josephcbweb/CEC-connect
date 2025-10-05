import express from "express";
import {
  getStudentFeeDetails,
  getStudents,
} from "../controllers/studentController";

const router = express.Router();

router.get("/all", getStudents);
router.get("/:id/fees", getStudentFeeDetails);

export default router;
