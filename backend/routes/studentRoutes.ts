import express from "express";
import { getStudents } from "../controllers/studentController";

const router = express.Router();

router.get("/all", getStudents);

export default router;
