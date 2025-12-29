import express from "express";
import {
  getStudentFeeDetails,
  getStudents,
  getStudentProfile,
  updateStudentProfile,
  getAllBusRoutes,
} from "../controllers/studentController";

const router = express.Router();

router.get("/all", getStudents);
router.get("/:id/fees", getStudentFeeDetails);
router.get("/profile/:id",getStudentProfile);
router.patch("/update/:id",updateStudentProfile);


export default router;
