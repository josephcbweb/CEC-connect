"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.undoLastPromotion = exports.getLastPromotion = exports.promoteStudents = exports.getPromotionPreview = exports.getSemesterInfo = void 0;
const promotionService_1 = require("../services/promotionService");
const jwt_1 = require("../utils/jwt");
const getSemesterInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const info = promotionService_1.PromotionService.getSemesterInfo();
        res.json(info);
    }
    catch (error) {
        console.error("Error getting semester info:", error);
        res.status(500).json({ error: error.message || "Failed to get semester information" });
    }
});
exports.getSemesterInfo = getSemesterInfo;
const getPromotionPreview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const preview = yield promotionService_1.PromotionService.getPromotionPreview();
        res.json(preview);
    }
    catch (error) {
        console.error("Error getting promotion preview:", error);
        res.status(500).json({ error: error.message || "Failed to get promotion preview" });
    }
});
exports.getPromotionPreview = getPromotionPreview;
const promoteStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = req.body;
        // Decode token to get user ID
        const authHeader = req.header("Authorization");
        const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.replace("Bearer ", "");
        if (!token) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        const adminId = decoded.userId;
        if (!adminId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const result = yield promotionService_1.PromotionService.promoteStudents(config, adminId);
        res.json(result);
    }
    catch (error) {
        console.error("Error promoting students:", error);
        res.status(500).json({ error: error.message || "Failed to promote students" });
    }
});
exports.promoteStudents = promoteStudents;
const getLastPromotion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lastPromotion = yield promotionService_1.PromotionService.getLastPromotion();
        res.json(lastPromotion);
    }
    catch (error) {
        console.error("Error getting last promotion:", error);
        res.status(500).json({ error: error.message || "Failed to get last promotion" });
    }
});
exports.getLastPromotion = getLastPromotion;
const undoLastPromotion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield promotionService_1.PromotionService.undoLastPromotion();
        res.json(result);
    }
    catch (error) {
        console.error("Error undoing promotion:", error);
        res.status(500).json({ error: error.message || "Failed to undo promotion" });
    }
});
exports.undoLastPromotion = undoLastPromotion;
