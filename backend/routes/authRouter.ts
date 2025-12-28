import { Router } from "express";
import AuthMiddleware from "../middlewares/authMiddlewares";
import AuthController from "../controllers/authController";

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

export default router;
