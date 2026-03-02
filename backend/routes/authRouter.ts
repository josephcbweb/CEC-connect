import { Router } from "express";
import AuthController from "../controllers/authController";
import AuthMiddleware from "../middlewares/authMiddlewares";

const router = Router();

router.post("/login-student", AuthController.StudentLogin);
router.post("/login", AuthController.login);
router.post("/register", AuthController.signup);
router.get(
  "/user/:id",
  AuthMiddleware.authenticate,
  AuthController.getUserById
);
router.get(
  "/student/:id",
  AuthMiddleware.authenticate,
  AuthController.getUserById
);
router.post("/logout", AuthMiddleware.authenticate, AuthController.logout);

export default router;
