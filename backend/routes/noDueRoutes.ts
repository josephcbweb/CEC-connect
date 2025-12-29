import express from "express";
import {
  getStudentStatus,
  registerSemester,
  bulkInitiateNoDue,
} from "../controllers/noDueController";

const router = express.Router();

router.post("/register", registerSemester);
router.get("/status", getStudentStatus);
router.post("/bulk-initiate", bulkInitiateNoDue);

export default router;
