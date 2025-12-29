import express from "express";
import { getPendingApprovals, clearDue } from "../controllers/noDueController";
import AuthMiddleware from "../middlewares/authMiddlewares";

const router = express.Router();

router.get("/approvals", getPendingApprovals);
router.post("/clear/:id", clearDue);

export default router;
