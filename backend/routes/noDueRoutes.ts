import express from "express";
import {
  getStudentStatus,
  registerSemester,
  bulkInitiateNoDue,
  bulkInitiateCheck,
} from "../controllers/noDueController";

const router = express.Router();

router.post("/register", registerSemester);
router.get("/status", getStudentStatus);
router.post("/bulk-initiate", bulkInitiateNoDue);
router.post("/bulk-initiate-check", bulkInitiateCheck);

export default router;
