import express from "express";
import { getAnalytics } from "../controllers/analyticsController";
import AuthMiddleware from "../middlewares/authMiddlewares";
import { requirePermission } from "../middlewares/permissionMiddleware";

const router = express.Router();

router.use(AuthMiddleware.authenticate);
router.get("/", requirePermission("view:analytics"), getAnalytics);

export default router;
