import express from "express";
import {
  getStudentStatus,
  registerSemester,
  bulkInitiateNoDue,
  bulkInitiateCheck,
  sendPendingEmails,
} from "../controllers/noDueController";

const router = express.Router();

router.post("/register", registerSemester);
router.get("/status", getStudentStatus);
router.post("/bulk-initiate", bulkInitiateNoDue);
router.post("/bulk-initiate-check", bulkInitiateCheck);
router.post("/send-emails", sendPendingEmails);

export default router;
