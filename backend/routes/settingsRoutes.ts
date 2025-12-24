import express from "express";
import { toggleSettings,getSemesterStats,promoteStudents } from "../controllers/settingsController";

const router = express.Router();

router.put("/settings", toggleSettings);
router.get("/semStats",getSemesterStats);
router.post("/promote",promoteStudents);

export default router;
