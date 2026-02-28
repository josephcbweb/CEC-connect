import express from "express";
import {
  getStudentStatus,
  registerSemester,
  bulkInitiateNoDue,
  bulkInitiateCheck,
  sendPendingEmails,
} from "../controllers/noDueController";
import AuthMiddleware from "../middlewares/authMiddlewares";
import { requirePermission } from "../middlewares/permissionMiddleware";

const router = express.Router();

router.use(AuthMiddleware.authenticate);

router.post("/register", registerSemester);
router.get("/status", getStudentStatus);
router.post(
  "/bulk-initiate",
  requirePermission("due:bulk_initiate"),
  bulkInitiateNoDue,
);
router.post(
  "/bulk-initiate-check",
  requirePermission("due:bulk_initiate"),
  bulkInitiateCheck,
);
router.post(
  "/send-emails",
  requirePermission("due:send_emails"),
  sendPendingEmails,
);

export default router;
