import express from "express";
import {
  getSemesterInfo,
  getPromotionPreview,
  promoteStudents,
  getLastPromotion,
  undoLastPromotion,
} from "../controllers/promotionController";
import AuthMiddleware from "../middlewares/authMiddlewares";

const router = express.Router();

// Get current semester info
router.get("/semester-info", AuthMiddleware.authenticate, getSemesterInfo);

// Get promotion preview (student counts)
router.get("/promotion-preview", AuthMiddleware.authenticate, getPromotionPreview);

// Execute promotion
router.post("/promote", AuthMiddleware.authenticate, promoteStudents);

// Get last promotion history
router.get("/last-promotion", AuthMiddleware.authenticate, getLastPromotion);

// Undo last promotion
router.post("/undo-promotion", AuthMiddleware.authenticate, undoLastPromotion);

export default router;
