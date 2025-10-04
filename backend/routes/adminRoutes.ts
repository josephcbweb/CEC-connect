import express from "express";
import { Router } from "express";
import {fetchStats,fetchAllStudents} from "../Controllers/adminController";

const router = express.Router();

router.get("/viewStats",fetchStats);
router.get("/students", fetchAllStudents);

export default router;