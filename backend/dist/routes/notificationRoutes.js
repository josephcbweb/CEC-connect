"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controllers/notificationController");
const authMiddlewares_1 = __importDefault(require("../middlewares/authMiddlewares"));
const router = express_1.default.Router();
// Admin routes
router.post("/", notificationController_1.createNotification);
router.get("/", notificationController_1.getNotifications);
router.put("/:id", notificationController_1.updateNotification);
router.delete("/:id", notificationController_1.deleteNotification);
// Student routes - protected
router.get("/my-notifications", authMiddlewares_1.default.authenticate, notificationController_1.getStudentNotifications);
exports.default = router;
