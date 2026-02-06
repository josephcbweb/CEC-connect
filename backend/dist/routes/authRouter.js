"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const authMiddlewares_1 = __importDefault(require("../middlewares/authMiddlewares"));
const router = (0, express_1.Router)();
router.post("/login-student", authController_1.default.StudentLogin);
router.post("/login", authController_1.default.login);
router.post("/register", authController_1.default.signup);
router.get("/user/:id", authMiddlewares_1.default.authenticate, authController_1.default.getUserById);
router.get("/student/:id", authMiddlewares_1.default.authenticate, authController_1.default.getUserById);
exports.default = router;
