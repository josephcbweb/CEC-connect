import express from "express";
import {
  createNotification,
  getNotifications,
  getStudentNotifications,
  updateNotification,
  deleteNotification,
  registerToken,
} from "../controllers/notificationController";
import AuthMiddleware from "../middlewares/authMiddlewares";

const router = express.Router();

// Admin routes
router.post("/", createNotification);
router.get("/", getNotifications);
router.put("/:id", updateNotification);
router.delete("/:id", deleteNotification);

// Student routes - protected
router.get(
  "/my-notifications",
  AuthMiddleware.authenticate,
  getStudentNotifications,
);

router.post("/register-token", AuthMiddleware.authenticate, registerToken);

export default router;
