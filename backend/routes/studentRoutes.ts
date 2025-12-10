import express from "express";
import {
  getStudentFeeDetails,
  getStudents,
  getStudentProfile,
} from "../Controllers/studentController";

const router = express.Router();

router.get("/all", getStudents);
router.get("/:id/fees", getStudentFeeDetails);
router.get("/profile/:id",getStudentProfile);


export default router;
