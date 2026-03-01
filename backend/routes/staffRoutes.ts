import express from "express";
import {
  getPendingApprovals,
  clearDue,
  bulkClearDues,
} from "../controllers/noDueController";
import AuthMiddleware from "../middlewares/authMiddlewares";

const router = express.Router();

// All staff routes require authentication
router.use(AuthMiddleware.authenticate);

router.get("/approvals", getPendingApprovals);
router.post("/bulk-clear", bulkClearDues);
router.post("/clear/:id", clearDue);

export default router;
