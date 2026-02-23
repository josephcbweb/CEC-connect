"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promotionController_1 = require("../controllers/promotionController");
const router = express_1.default.Router();
router.get("/stats", promotionController_1.getPromotionStats);
router.post("/promote", promotionController_1.promoteStudents);
router.post("/undo", promotionController_1.undoLastPromotion);
exports.default = router;
