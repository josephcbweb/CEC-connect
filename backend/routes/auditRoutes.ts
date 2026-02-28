import express from "express";
import { getAuditLogs, getAuditLogStats } from "../controllers/auditController";
import AuthMiddleware from "../middlewares/authMiddlewares";
import { requirePermission } from "../middlewares/permissionMiddleware";

const router = express.Router();

router.use(AuthMiddleware.authenticate);

router.get("/", requirePermission("view:audit_logs"), getAuditLogs);
router.get("/stats", requirePermission("view:audit_logs"), getAuditLogStats);

export default router;
