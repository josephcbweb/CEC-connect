import express from "express";
import { Router } from "express";
import { addDepartment, deleteDepartment, getDepartment } from "../controllers/departmentController";

const router = express.Router();

router.get("/alldepartments",getDepartment);
router.post("/alldepartments",addDepartment);
router.delete("/:id",deleteDepartment);

export default router;