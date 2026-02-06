import express from "express";
import {
  getSemesterInfo,
  getPromotionPreview,
  promoteStudents,
  getLastPromotion,
  undoLastPromotion,
} from "../controllers/promotionController";
import AuthMiddleware from "../middlewares/authMiddlewares";
import { rateLimiter } from "../middlewares/rateLimiter";

const router = express.Router();

// Rate limits:
// - Read operations: 30 requests per minute
// - Write operations (promote/undo): 5 requests per 5 minutes
const readRateLimit = rateLimiter(30, 60 * 1000);
const writeRateLimit = rateLimiter(5, 5 * 60 * 1000);

// Get current semester info
router.get("/semester-info", AuthMiddleware.authenticate, readRateLimit, getSemesterInfo);

// Get promotion preview (student counts)
router.get("/promotion-preview", AuthMiddleware.authenticate, readRateLimit, getPromotionPreview);

// Execute promotion (rate limited to prevent abuse)
router.post("/promote", AuthMiddleware.authenticate, writeRateLimit, promoteStudents);

// Get last promotion history
router.get("/last-promotion", AuthMiddleware.authenticate, readRateLimit, getLastPromotion);

// Undo last promotion (rate limited to prevent abuse)
router.post("/undo-promotion", AuthMiddleware.authenticate, writeRateLimit, undoLastPromotion);

export default router;
