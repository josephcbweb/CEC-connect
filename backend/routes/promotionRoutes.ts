import express from "express";
import {
  getPromotionStats,
  promoteStudents,
  undoLastPromotion,
} from "../controllers/promotionController";

const router = express.Router();

router.get("/stats", getPromotionStats);
router.post("/promote", promoteStudents);
router.post("/undo", undoLastPromotion);

export default router;
