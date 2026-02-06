"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promotionController_1 = require("../controllers/promotionController");
const authMiddlewares_1 = __importDefault(require("../middlewares/authMiddlewares"));
const router = express_1.default.Router();
// Get current semester info
router.get("/semester-info", authMiddlewares_1.default.authenticate, promotionController_1.getSemesterInfo);
// Get promotion preview (student counts)
router.get("/promotion-preview", authMiddlewares_1.default.authenticate, promotionController_1.getPromotionPreview);
// Execute promotion
router.post("/promote", authMiddlewares_1.default.authenticate, promotionController_1.promoteStudents);
// Get last promotion history
router.get("/last-promotion", authMiddlewares_1.default.authenticate, promotionController_1.getLastPromotion);
// Undo last promotion
router.post("/undo-promotion", authMiddlewares_1.default.authenticate, promotionController_1.undoLastPromotion);
exports.default = router;
