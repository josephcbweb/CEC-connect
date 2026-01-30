import express from "express";
import {
    addDepartment,
    deleteDepartment,
    getDepartment,
    getEligibleFaculty,
    updateDepartmentHod,
} from "../controllers/departmentController";

const router = express.Router();

router.get("/", getDepartment);
router.post("/", addDepartment);
router.delete("/:id", deleteDepartment);
router.put("/:id/hod", updateDepartmentHod);
router.get("/faculty/eligible", getEligibleFaculty);

export default router;